import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExecutionLogger {
  constructor(private prisma: PrismaService) {}

  async logEvent(
    executionId: string,
    type: string,
    nodeId?: string,
    data?: any,
    metrics?: any,
  ) {
    await this.prisma.executionEvent.create({
      data: {
        executionId,
        type, // EXECUTION_STARTED, NODE_STARTED, NODE_COMPLETED, NODE_FAILED, EXECUTION_COMPLETED, EXECUTION_FAILED
        nodeId,
        data: data || {},
        promptTokens: metrics?.promptTokens,
        completionTokens: metrics?.completionTokens,
        totalTokens: metrics?.totalTokens,
        model: metrics?.model,
        estimatedCost: metrics?.estimatedCost,
      },
    });
  }
}
