import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  Inject,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../auth/audit.service';
import { Client } from '@temporalio/client';

@Injectable()
export class ApprovalService {
  private readonly logger = new Logger(ApprovalService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject('TEMPORAL_CLIENT') private temporalClient: Client,
  ) {}

  async getPendingApprovals(workspaceId: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        workspaceId,
        status: 'PENDING',
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getApprovalHistory(workspaceId: string) {
    return this.prisma.approvalRequest.findMany({
      where: {
        workspaceId,
        status: { not: 'PENDING' },
      },
      orderBy: { createdAt: 'desc' },
      take: 100, // Beta limit
    });
  }

  async getApproval(workspaceId: string, approvalId: string) {
    const approval = await this.prisma.approvalRequest.findUnique({
      where: { id: approvalId },
    });

    if (!approval || approval.workspaceId !== workspaceId) {
      throw new NotFoundException('Approval not found');
    }

    return approval;
  }

  async submitDecision(
    workspaceId: string,
    approvalId: string,
    decision: 'APPROVED' | 'REJECTED',
    userId: string,
    decisionReason?: string,
  ) {
    // 1. Verify workspace admin role
    const member = await this.prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      include: { role: true },
    });

    if (
      !member ||
      (member.role.name !== 'Admin' && member.role.name !== 'Owner')
    ) {
      throw new ForbiddenException(
        'Only Workspace Admins can approve or reject execution nodes.',
      );
    }

    if (decision === 'REJECTED' && !decisionReason?.trim()) {
      throw new BadRequestException(
        'A decision reason must be provided when rejecting an approval.',
      );
    }

    // 2. Fetch approval
    const approval = await this.getApproval(workspaceId, approvalId);

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(
        `Approval is already in ${approval.status} state.`,
      );
    }

    // 3. Update Approval
    const updated = await this.prisma.approvalRequest.update({
      where: { id: approvalId },
      data: {
        status: decision,
        approvedBy: userId,
        approvedAt: new Date(),
        decisionReason: decisionReason || null,
      },
    });

    // 4. Audit Log
    await this.audit.log({
      workspaceId,
      actor: userId,
      action: `APPROVAL_${decision}`,
      resource: `ApprovalRequest:${approvalId}`,
      metadata: {
        nodeName: approval.nodeName,
        executionId: approval.executionId,
        reason: decisionReason,
      },
    });

    // 5. Trigger Execution Resume/Fail logic based on decision
    const handle = this.temporalClient.workflow.getHandle(
      `execution-${approval.executionId}`,
    );

    if (decision === 'APPROVED') {
      await this.prisma.execution.update({
        where: { id: approval.executionId },
        data: { status: 'RUNNING' },
      });
      await this.audit.log({
        workspaceId,
        actor: 'SYSTEM',
        action: 'EXECUTION_RESUMED',
        resource: `Execution:${approval.executionId}`,
        metadata: { approvalId },
      });

      // Signal Temporal with the immutable snapshot to ensure stale protection
      await handle.signal('approve', {
        nodeId: approval.nodeId,
        userId,
        payloadSnapshot: approval.payloadSnapshot,
      });
    } else {
      await this.prisma.execution.update({
        where: { id: approval.executionId },
        data: { status: 'FAILED' },
      });
      await this.audit.log({
        workspaceId,
        actor: 'SYSTEM',
        action: 'EXECUTION_FAILED',
        resource: `Execution:${approval.executionId}`,
        metadata: { approvalId, reason: 'REJECTED_BY_ADMIN' },
      });

      await handle.signal('reject', {
        nodeId: approval.nodeId,
        userId,
        reason: decisionReason,
      });
    }

    return updated;
  }

  async cancelApproval(
    workspaceId: string,
    approvalId: string,
    userId: string,
  ) {
    const approval = await this.getApproval(workspaceId, approvalId);

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(
        `Cannot cancel approval in ${approval.status} state.`,
      );
    }

    const updated = await this.prisma.approvalRequest.update({
      where: { id: approvalId },
      data: { status: 'CANCELLED' },
    });

    await this.audit.log({
      workspaceId,
      actor: userId,
      action: 'APPROVAL_CANCELLED',
      resource: `ApprovalRequest:${approvalId}`,
      metadata: {},
    });

    return updated;
  }

  // Cleanup job meant to be triggered by cron or scheduler
  async expireStaleApprovals() {
    const now = new Date();
    const staleApprovals = await this.prisma.approvalRequest.findMany({
      where: {
        status: 'PENDING',
        expiresAt: { lt: now },
      },
    });

    for (const approval of staleApprovals) {
      await this.prisma.approvalRequest.update({
        where: { id: approval.id },
        data: { status: 'EXPIRED' },
      });

      // Fail corresponding execution
      await this.prisma.execution.update({
        where: { id: approval.executionId },
        data: { status: 'FAILED' },
      });

      await this.audit.log({
        workspaceId: approval.workspaceId,
        actor: 'SYSTEM',
        action: 'APPROVAL_EXPIRED',
        resource: `ApprovalRequest:${approval.id}`,
        metadata: {},
      });
    }

    if (staleApprovals.length > 0) {
      this.logger.log(`Expired ${staleApprovals.length} stale approvals.`);
    }
  }
}
