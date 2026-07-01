import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ExecutionStateManager {
  constructor(private prisma: PrismaService) {}

  async updateStatus(
    executionId: string,
    status: string,
    additionalData: any = {},
  ) {
    // status: PENDING, RUNNING, PAUSED, COMPLETED, FAILED, CANCELLED
    const updateData: any = { status, ...additionalData };

    if (status === 'RUNNING' && !additionalData.startedAt) {
      updateData.startedAt = new Date();
    }

    if (
      ['COMPLETED', 'FAILED', 'CANCELLED'].includes(status) &&
      !additionalData.completedAt
    ) {
      updateData.completedAt = new Date();
    }

    await this.prisma.execution.update({
      where: { id: executionId },
      data: updateData,
    });
  }
}
