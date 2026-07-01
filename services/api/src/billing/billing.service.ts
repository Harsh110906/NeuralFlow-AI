import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BillingSummaryDto } from './dto/billing-dashboard.dto';
import {
  BillingEventType,
  BillingLedgerService,
} from './billing-ledger.service';
// Assuming stripe is initialized elsewhere or we can use a mock for now
// import Stripe from 'stripe';

@Injectable()
export class BillingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly billingLedgerService: BillingLedgerService,
  ) {}

  async getBillingSummary(workspaceId: string): Promise<BillingSummaryDto> {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });

    if (!workspace) {
      throw new NotFoundException('Workspace not found');
    }

    // Mocking stripe calls for the purpose of the architecture
    // In reality, we would query our Ledger for token usage
    return {
      billingConfigured: !!workspace.stripeId,
      canManageBilling: true,
      syncStatus: 'synced',
      lastStripeSyncAt: new Date(),

      planName: workspace.plan || 'Free Tier',
      subscriptionStatus: (workspace as any).subscriptionStatus || 'none',
      currentPeriodStart: new Date(
        new Date().setMonth(new Date().getMonth() - 1),
      ),
      currentPeriodEnd: new Date(),

      rawTokenUsage: 0,
      tokenLimit: 100000,

      hasDefaultPaymentMethod: true,
      meteredUsageCostCents: 0,
      upcomingInvoiceTotalCents: 0,
    };
  }

  async getUsageChart(workspaceId: string): Promise<any> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const usageEvents = await this.prisma.billingLedger.findMany({
      where: {
        workspaceId,
        type: BillingEventType.USAGE,
        createdAt: { gte: startOfMonth },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by day
    const dailyMap = new Map<string, number>();
    for (const ev of usageEvents) {
      const day = ev.createdAt.toISOString().split('T')[0];
      const prev = dailyMap.get(day) || 0;
      dailyMap.set(day, prev + ev.amountUsd);
    }

    const data = Array.from(dailyMap.entries()).map(([date, amountUsd]) => ({
      date,
      amountUsd,
    }));

    return { data };
  }

  async getLedgerHistory(workspaceId: string) {
    return this.billingLedgerService.getLedgerHistory(workspaceId);
  }

  async updateBillingPolicy(
    workspaceId: string,
    updates: {
      monthlyBudget?: number;
      softWarningThreshold?: number;
      hardCutoff?: boolean;
    },
  ) {
    return this.prisma.workspaceBillingPolicy.upsert({
      where: { workspaceId },
      update: updates,
      create: {
        workspaceId,
        ...updates,
      },
    });
  }

  async createPortalSession(workspaceId: string): Promise<{ url: string }> {
    // Implement Stripe Portal Session logic
    // const session = await stripe.billingPortal.sessions.create({ ... });
    return { url: 'https://billing.stripe.com/p/session/mock' };
  }

  async createCheckoutSession(
    workspaceId: string,
    planId: string,
  ): Promise<{ url: string }> {
    // Implement Stripe Checkout Session logic
    // Includes injecting workspaceId and planId to subscription_data.metadata
    return { url: 'https://checkout.stripe.com/c/pay/mock' };
  }
}
