import { Controller, Get, Post, Param, UseGuards, Body } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingSummaryDto } from './dto/billing-dashboard.dto';
// Mock imports for Guards
// import { RolesGuard, Roles } from '../workspace/roles.guard';
// import { WorkspaceGuard } from '../workspace/workspace.guard';

@Controller('workspaces/:workspaceId/billing')
// @UseGuards(WorkspaceGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('summary')
  // @Roles('ADMIN', 'MEMBER')
  async getSummary(
    @Param('workspaceId') workspaceId: string,
  ): Promise<BillingSummaryDto> {
    return this.billingService.getBillingSummary(workspaceId);
  }

  @Get('usage-chart')
  // @Roles('ADMIN', 'MEMBER')
  async getUsageChart(@Param('workspaceId') workspaceId: string) {
    return this.billingService.getUsageChart(workspaceId);
  }

  @Get('ledger')
  // @Roles('ADMIN', 'MEMBER')
  async getLedger(@Param('workspaceId') workspaceId: string) {
    // Note: Assuming we inject BillingLedgerService, wait, I need to inject it!
    // Instead of importing/injecting here, I should expose it via BillingService.
    return this.billingService.getLedgerHistory(workspaceId);
  }

  @Post('policy')
  // @Roles('ADMIN')
  async updatePolicy(
    @Param('workspaceId') workspaceId: string,
    @Body()
    body: {
      monthlyBudget?: number;
      softWarningThreshold?: number;
      hardCutoff?: boolean;
    },
  ) {
    return this.billingService.updateBillingPolicy(workspaceId, body);
  }

  @Post('portal-session')
  // @Roles('ADMIN')
  async createPortalSession(@Param('workspaceId') workspaceId: string) {
    return this.billingService.createPortalSession(workspaceId);
  }

  @Post('checkout-session')
  // @Roles('ADMIN')
  async createCheckoutSession(
    @Param('workspaceId') workspaceId: string,
    @Body('planId') planId: string,
  ) {
    return this.billingService.createCheckoutSession(workspaceId, planId);
  }
}
