import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { LLMProvider } from '../execution/interfaces/llm.provider';

@Injectable()
export class WorkflowDoctorService {
  constructor(
    private prisma: PrismaService,
    @Inject('LLMProvider') private readonly llmProvider: LLMProvider,
  ) {}

  async calculateHealthScore(workflowId: string): Promise<number> {
    const executions = await this.prisma.execution.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (executions.length === 0) return 100;

    const failed = executions.filter((e) => e.status === 'FAILED').length;
    const failurePenalty = (failed / executions.length) * 50; // Max 50 points lost for failures

    const score = 100 - failurePenalty;
    return Math.max(0, Math.round(score));
  }

  async analyzeFailure(executionId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: { events: true, workflow: true },
    });

    if (!execution) throw new Error('Execution not found');

    const prompt = `Analyze this execution trace and determine why it failed. Suggest a fix.\nTrace: ${JSON.stringify(execution.events)}`;
    const systemPrompt = `You are Workflow Doctor, an expert diagnostic AI for NeuralFlow. Focus on root causes of failures.`;

    const result = await this.llmProvider.generate(prompt, systemPrompt);
    return result.content;
  }

  async analyzeCost(executionId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: { events: true, workflow: true },
    });

    const prompt = `Analyze this execution trace and identify how to reduce token usage and cost.\nTrace: ${JSON.stringify(execution?.events)}`;
    const systemPrompt = `You are Workflow Doctor, an expert at reducing LLM costs and optimizing token usage. Suggest model switches (e.g. gpt-4o to gpt-4o-mini) or context reduction strategies.`;

    const result = await this.llmProvider.generate(prompt, systemPrompt);
    return result.content;
  }

  async analyzeArchitecture(workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    const prompt = `Analyze this workflow DAG and identify architectural flaws (missing retries, dangerous API calls, unreachable nodes).\nDAG: ${JSON.stringify(workflow?.dagJson)}`;
    const systemPrompt = `You are Workflow Doctor, an expert at AI architecture.`;

    const result = await this.llmProvider.generate(prompt, systemPrompt);
    return result.content;
  }
}
