import { Controller, Get, Post, Param, Body, Req } from '@nestjs/common';
import { ApprovalService } from './approval.service';

@Controller('workspaces/:workspaceId/approvals')
export class ApprovalController {
  constructor(private readonly approvalService: ApprovalService) {}

  @Get('pending')
  async getPendingApprovals(@Param('workspaceId') workspaceId: string) {
    return this.approvalService.getPendingApprovals(workspaceId);
  }

  @Get('history')
  async getApprovalHistory(@Param('workspaceId') workspaceId: string) {
    return this.approvalService.getApprovalHistory(workspaceId);
  }

  @Get(':id')
  async getApproval(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.approvalService.getApproval(workspaceId, id);
  }

  @Post(':id/decision')
  async submitDecision(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() body: { decision: 'APPROVED' | 'REJECTED'; reason?: string },
    @Req() req: any,
  ) {
    // User auth comes from Clerk middleware
    const userId = req.user?.id || 'mock-admin-user'; // Replace with actual extracted userId in production
    return this.approvalService.submitDecision(
      workspaceId,
      id,
      body.decision,
      userId,
      body.reason,
    );
  }

  @Post(':id/cancel')
  async cancelApproval(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'mock-user';
    return this.approvalService.cancelApproval(workspaceId, id, userId);
  }
}
