import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function maskSensitiveData(obj: any): any {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => maskSensitiveData(item));
  }

  const redacted = { ...obj };
  const sensitivePatterns = /secret|password|token|key|authorization|auth/i;

  for (const key of Object.keys(redacted)) {
    if (sensitivePatterns.test(key) && typeof redacted[key] === 'string') {
      redacted[key] = '********';
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = maskSensitiveData(redacted[key]);
    }
  }
  return redacted;
}

@Injectable()
export class ObservatoryService {
  constructor(private prisma: PrismaService) {}

  async getWorkspaceMetrics(workspaceId: string) {
    const executions = await this.prisma.execution.findMany({
      where: { workflow: { workspaceId } },
      include: { events: true },
    });

    const totalExecutions = executions.length;
    const completed = executions.filter((e) => e.status === 'COMPLETED');
    const failed = executions.filter((e) => e.status === 'FAILED');
    const inProgress = executions.filter(
      (e) => e.status === 'RUNNING' || e.status === 'PENDING',
    );

    const successRate = totalExecutions
      ? (completed.length / totalExecutions) * 100
      : 0;
    const failureRate = totalExecutions
      ? (failed.length / totalExecutions) * 100
      : 0;

    let totalRuntime = 0;
    let completedWithTime = 0;
    let totalTokens = 0;
    let totalCost = 0;

    const failureCategories: Record<string, number> = {
      'Rate Limit Exceeded': 0,
      Timeout: 0,
      'Context Length Exceeded': 0,
      Unknown: 0,
    };

    executions.forEach((exec) => {
      if (exec.startedAt && exec.completedAt) {
        totalRuntime += exec.completedAt.getTime() - exec.startedAt.getTime();
        completedWithTime++;
      }

      let hasErrorEvent = false;

      exec.events.forEach((ev) => {
        totalTokens += ev.totalTokens || 0;
        totalCost += ev.estimatedCost || 0;

        if (ev.type === 'EXECUTION_FAILED' || ev.type === 'NODE_FAILED') {
          hasErrorEvent = true;
          // Basic mock categorization based on potential error data
          const errorMsg = (ev.data as any)?.error?.toLowerCase() || '';
          if (errorMsg.includes('rate limit'))
            failureCategories['Rate Limit Exceeded']++;
          else if (errorMsg.includes('timeout')) failureCategories['Timeout']++;
          else if (errorMsg.includes('context'))
            failureCategories['Context Length Exceeded']++;
          else failureCategories['Unknown']++;
        }
      });

      // If failed but no specific event parsed, bump unknown
      if (exec.status === 'FAILED' && !hasErrorEvent) {
        failureCategories['Unknown']++;
      }
    });

    const averageRuntime = completedWithTime
      ? totalRuntime / completedWithTime
      : 0;

    const activeWorkflows = await this.prisma.workflow.count({
      where: { workspaceId },
    });
    const activeAgents = await this.prisma.agent.count({
      where: { workspaceId },
    });
    const memoryRetrievalCount = 0;

    return {
      executionMetrics: {
        totalExecutions,
        successRate,
        failureRate,
        averageRuntime,
        failedCount: failed.length,
        inProgressCount: inProgress.length,
        failureCategories,
      },
      aiMetrics: {
        totalTokens,
        totalCost,
      },
      systemMetrics: {
        activeWorkflows,
        activeAgents,
        memoryRetrievalCount,
      },
    };
  }

  async getRecentExecutions(workspaceId: string, limit: number = 20) {
    const executions = await this.prisma.execution.findMany({
      where: { workflow: { workspaceId } },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        workflow: {
          select: { name: true },
        },
      },
    });

    return executions.map((exec) => {
      let durationMs = 0;
      if (exec.startedAt && exec.completedAt) {
        durationMs = exec.completedAt.getTime() - exec.startedAt.getTime();
      } else if (exec.startedAt) {
        durationMs = new Date().getTime() - exec.startedAt.getTime();
      }

      return {
        id: exec.id,
        workflowName: exec.workflow.name,
        status: exec.status,
        startedAt: exec.startedAt,
        completedAt: exec.completedAt,
        durationMs,
        tokenUsage: exec.tokenUsage,
        cost: exec.cost,
      };
    });
  }

  async getExecutionDetail(workspaceId: string, executionId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        workflow: { select: { name: true, workspaceId: true } },
        events: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!execution || execution.workflow.workspaceId !== workspaceId) {
      throw new NotFoundException(`Execution ${executionId} not found.`);
    }

    let durationMs = 0;
    if (execution.startedAt && execution.completedAt) {
      durationMs =
        execution.completedAt.getTime() - execution.startedAt.getTime();
    }

    // Identify failures for the summary
    const failureEvents = execution.events.filter(
      (e) => e.type === 'EXECUTION_FAILED' || e.type === 'NODE_FAILED',
    );
    const failureSummary = failureEvents.map((e) => ({
      nodeId: e.nodeId,
      error: (e.data as any)?.error || 'Unknown error occurred',
      timestamp: e.createdAt,
    }));

    return {
      executionId: execution.id,
      workflowName: execution.workflow.name,
      status: execution.status,
      startedAt: execution.startedAt,
      completedAt: execution.completedAt,
      durationMs,
      totalTokens: execution.tokenUsage,
      totalCost: execution.cost,
      failureSummary: failureSummary.length > 0 ? failureSummary : null,
      timeline: execution.events.map((ev) => ({
        eventId: ev.id,
        type: ev.type,
        nodeId: ev.nodeId,
        timestamp: ev.createdAt,
        data: maskSensitiveData(ev.data),
        promptTokens: ev.promptTokens,
        completionTokens: ev.completionTokens,
        model: ev.model,
      })),
    };
  }
}
