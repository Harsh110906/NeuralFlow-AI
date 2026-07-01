import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../auth/audit.service';
import { EvaluationRunService } from '../evaluation/evaluation-run.service';

@Injectable()
export class AgentReleaseService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private evaluation: EvaluationRunService,
  ) {}

  async getReleases(agentId: string) {
    return this.prisma.agentRelease.findMany({
      where: { agentId },
      include: {
        version: true,
      },
      orderBy: { environment: 'asc' },
    });
  }

  async promoteVersion(
    agentId: string,
    versionId: string,
    environment: string,
    userId: string,
    bypassEvaluationCheck: boolean = false,
  ) {
    // Validate that agent and version exist
    const version = await this.prisma.agentVersion.findFirst({
      where: { id: versionId, agentId },
    });
    if (!version) throw new NotFoundException('Agent version not found');

    // Evaluation Guardrail
    if (environment === 'PROD' && !bypassEvaluationCheck) {
      // Find the latest completed evaluation run for this agent version
      const latestRun = await this.prisma.evaluationRun.findFirst({
        where: { agentVersionId: versionId, status: 'COMPLETED' },
        orderBy: { createdAt: 'desc' },
      });
      if (!latestRun) {
        throw new BadRequestException(
          'Cannot promote to PROD: No completed evaluation run found. Pass bypassEvaluationCheck=true if you wish to force.',
        );
      }

      const passRate = latestRun.deterministicPassRate || 0;
      const judgeScore = latestRun.judgeScoreAvg || 0;

      if (passRate < 0.8 && judgeScore < 0.8) {
        throw new BadRequestException(
          `Cannot promote to PROD: Evaluation score too low (Deterministic: ${passRate}, Judge: ${judgeScore}). Require 80%+.`,
        );
      }
    }

    const release = await this.prisma.agentRelease.upsert({
      where: {
        agentId_environment: {
          agentId,
          environment,
        },
      },
      update: {
        versionId,
        promotedBy: userId,
      },
      create: {
        agentId,
        versionId,
        environment,
        promotedBy: userId,
      },
      include: {
        version: true,
      },
    });

    await this.audit.log({
      actor: userId,
      action: 'AGENT_PROMOTED',
      resource: `agent:${agentId}`,
      workspaceId: 'workspace',
      metadata: { versionId, environment },
    });

    return release;
  }

  async rollbackToVersion(
    agentId: string,
    environment: string,
    versionId: string,
    userId: string,
  ) {
    const version = await this.prisma.agentVersion.findFirst({
      where: { id: versionId, agentId },
    });
    if (!version)
      throw new NotFoundException('Target rollback version not found');

    const release = await this.prisma.agentRelease.upsert({
      where: { agentId_environment: { agentId, environment } },
      update: { versionId, promotedBy: userId },
      create: { agentId, versionId, environment, promotedBy: userId },
      include: { version: true },
    });

    await this.audit.log({
      actor: userId,
      action: 'AGENT_ROLLED_BACK',
      resource: `agent:${agentId}`,
      workspaceId: 'workspace',
      metadata: { versionId, environment },
    });

    return release;
  }
}
