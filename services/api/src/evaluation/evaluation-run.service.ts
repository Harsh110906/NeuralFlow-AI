import {
  Injectable,
  NotFoundException,
  Inject,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AssertionEngine, Assertion } from './assertion.engine';
import { LLMJudgeProvider } from './llm-judge.provider';
import { JudgeRubricLibrary } from './judge-rubric.library';

@Injectable()
export class EvaluationRunService {
  constructor(
    private prisma: PrismaService,
    private assertionEngine: AssertionEngine,
    private llmJudgeProvider: LLMJudgeProvider,
    private rubricLibrary: JudgeRubricLibrary,
    @Inject('LLMProvider') private llmProvider: any,
  ) {}

  async runEvaluation(
    workspaceId: string,
    datasetVersionId: string,
    agentVersionId: string,
    judgeModel: string = 'gpt-4o',
  ) {
    // 1. Budget Check
    const budget = await this.prisma.evaluationBudget.findUnique({
      where: { workspaceId },
    });
    if (budget && budget.currentUsageUsd >= budget.monthlyLimitUsd) {
      throw new ForbiddenException('Evaluation budget exceeded');
    }

    const datasetVersion =
      await this.prisma.evaluationDatasetVersion.findUnique({
        where: { id: datasetVersionId },
        include: { testCases: true },
      });
    if (!datasetVersion)
      throw new NotFoundException('Dataset Version not found');

    const agentVersion = await this.prisma.agentVersion.findUnique({
      where: { id: agentVersionId },
    });
    if (!agentVersion) throw new NotFoundException('Agent Version not found');

    const run = await this.prisma.evaluationRun.create({
      data: {
        datasetVersionId,
        agentVersionId,
        judgeConfig: {
          provider: 'OPENAI',
          model: judgeModel,
          isMocked: true, // Mocked for beta
        },
        status: 'RUNNING',
      },
    });

    // Run async
    this.executeRun(
      run.id,
      workspaceId,
      datasetVersion.testCases,
      agentVersion,
      judgeModel,
    ).catch(console.error);

    return run;
  }

  private async executeRun(
    runId: string,
    workspaceId: string,
    testCases: any[],
    agentVersion: any,
    judgeModel: string,
  ) {
    let deterministicPassedCount = 0;
    let deterministicTotal = 0;
    let judgeTotalScore = 0;
    let totalLatency = 0;
    let totalCost = 0;
    let totalConfidence = 0;
    let evaluatedCount = 0;

    for (const tc of testCases) {
      const startTime = Date.now();

      let outputText = '';
      let runCost = 0;

      // 1. Generate Agent Output
      try {
        const response = await this.llmProvider.chat(
          [
            { role: 'system', content: agentVersion.systemPrompt },
            { role: 'user', content: JSON.stringify(tc.input) },
          ],
          agentVersion.model,
          agentVersion.temperature,
        );

        outputText = response.content;
        runCost += (response.usage?.totalTokens || 0) * 0.000002;
      } catch (err) {
        console.error('LLM Evaluation Error:', err);
        outputText = '';
      }

      const latency = Date.now() - startTime;

      let deterministicPassed: boolean | null = null;
      let judgeResponseData: any = null;
      const assertions = (tc.assertions || []) as Assertion[];

      // 2. Evaluate
      const llmAssertion = assertions.find(
        (a) => (a.type as any) === 'LLM_JUDGE',
      );
      const deterministicAssertions = assertions.filter(
        (a) => (a.type as any) !== 'LLM_JUDGE',
      );

      if (llmAssertion) {
        // LLM Judge Evaluation
        const rubricName = llmAssertion.value;
        const rubricText =
          this.rubricLibrary.getRubric(rubricName) || rubricName; // fallback to custom

        try {
          const judgeResult = await this.llmJudgeProvider.evaluate(
            tc.input,
            outputText,
            rubricText,
            judgeModel,
          );

          judgeResponseData = judgeResult;
          judgeTotalScore += judgeResult.score;
          totalConfidence += judgeResult.confidence;
          evaluatedCount++;

          runCost += 0.005; // Mock judge cost
        } catch (e) {
          console.error('Judge evaluation failed', e);
        }
      }

      if (deterministicAssertions.length > 0) {
        deterministicPassed = this.assertionEngine.evaluate(
          outputText,
          deterministicAssertions,
        );
        deterministicTotal++;
        if (deterministicPassed) {
          deterministicPassedCount++;
        }
      }

      // Store Trace
      await this.prisma.evaluationTrace.create({
        data: {
          evaluationRunId: runId,
          input: tc.input,
          output: { text: outputText },
          rubric: llmAssertion
            ? this.rubricLibrary.getRubric(llmAssertion.value) ||
              llmAssertion.value
            : null,
          judgeResponse: judgeResponseData,
          deterministicPassed,
        },
      });

      totalLatency += latency;
      totalCost += runCost;
    }

    const deterministicPassRate =
      deterministicTotal > 0
        ? deterministicPassedCount / deterministicTotal
        : null;
    const judgeScoreAvg =
      evaluatedCount > 0 ? judgeTotalScore / evaluatedCount : null;
    const avgLatencyMs =
      testCases.length > 0 ? Math.round(totalLatency / testCases.length) : null;
    const judgeConfidenceAvg =
      evaluatedCount > 0 ? totalConfidence / evaluatedCount : null;

    // Update Run
    await this.prisma.evaluationRun.update({
      where: { id: runId },
      data: {
        status: 'COMPLETED',
        deterministicPassRate,
        judgeScoreAvg,
        avgLatencyMs,
        totalCostUsd: totalCost,
        judgeConfidenceAvg,
        interJudgeAgreement: evaluatedCount > 0 ? 1.0 : null, // 1.0 because single judge MVP
      },
    });

    // Update Budget
    const budget = await this.prisma.evaluationBudget.findUnique({
      where: { workspaceId },
    });
    if (budget) {
      await this.prisma.evaluationBudget.update({
        where: { workspaceId },
        data: { currentUsageUsd: { increment: totalCost } },
      });
    }
  }

  async runPlayground(workspaceId: string, agentVersionId: string, input: any) {
    const agentVersion = await this.prisma.agentVersion.findUnique({
      where: { id: agentVersionId },
    });
    if (!agentVersion) throw new NotFoundException('Agent Version not found');

    const startTime = Date.now();
    try {
      const response = await this.llmProvider.chat(
        [
          { role: 'system', content: agentVersion.systemPrompt },
          { role: 'user', content: JSON.stringify(input) },
        ],
        agentVersion.model,
        agentVersion.temperature,
      );

      return {
        output: { text: response.content },
        usage: response.usage,
        latencyMs: Date.now() - startTime,
      };
    } catch (e) {
      console.error('Playground evaluation failed', e);
      throw e;
    }
  }

  async getRuns(workspaceId: string) {
    // Only return runs for dataset versions that belong to this workspace
    return this.prisma.evaluationRun.findMany({
      where: {
        datasetVersion: {
          dataset: {
            workspaceId,
          },
        },
      },
      include: {
        datasetVersion: { include: { dataset: true } },
        agentVersion: { include: { agent: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRun(runId: string) {
    const run = await this.prisma.evaluationRun.findUnique({
      where: { id: runId },
      include: {
        datasetVersion: { include: { dataset: true } },
        agentVersion: { include: { agent: true } },
      },
    });
    if (!run) throw new NotFoundException('Evaluation Run not found');
    return run;
  }

  async getTraces(runId: string, role: string = 'MEMBER') {
    const traces = await this.prisma.evaluationTrace.findMany({
      where: { evaluationRunId: runId },
      orderBy: { createdAt: 'asc' },
    });

    if (role !== 'ADMIN') {
      return traces.map((t) => {
        const redact = (obj: any): any => {
          if (!obj || typeof obj !== 'object') return obj;
          if (Array.isArray(obj)) return obj.map(redact);
          const newObj = { ...obj };
          for (const key of Object.keys(newObj)) {
            if (
              /secret|token|password|key|auth/i.test(key) &&
              typeof newObj[key] === 'string'
            ) {
              newObj[key] = '******** (REDACTED)';
            } else if (typeof newObj[key] === 'object') {
              newObj[key] = redact(newObj[key]);
            }
          }
          return newObj;
        };

        return {
          ...t,
          input: redact(t.input),
          output: redact(t.output),
          judgeResponse: t.judgeResponse
            ? {
                score: (t.judgeResponse as any).score,
                confidence: (t.judgeResponse as any).confidence,
                reasoning:
                  'Redacted for non-admin users. Score: ' +
                  (t.judgeResponse as any).score,
              }
            : null,
        };
      });
    }

    return traces;
  }
}
