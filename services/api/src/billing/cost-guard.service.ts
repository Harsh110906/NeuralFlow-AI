import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  BillingLedgerService,
  BillingEventType,
} from './billing-ledger.service';

@Injectable()
export class CostGuardService {
  private readonly logger = new Logger(CostGuardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: BillingLedgerService,
  ) {}

  /**
   * Checks if a workspace is allowed to execute a workflow based on its billing policy.
   * Throws an exception if the hard cutoff is reached and execution is blocked.
   * Logs a warning if the soft threshold is reached.
   */
  async checkBudget(
    workspaceId: string,
    estimatedCostUsd: number = 0,
  ): Promise<boolean> {
    const policy = await this.prisma.workspaceBillingPolicy.findUnique({
      where: { workspaceId },
    });

    // If no policy is defined, we assume no limits (or we could default to a free tier limit).
    if (!policy) {
      return true;
    }

    if (
      policy.executionCostLimit &&
      estimatedCostUsd > policy.executionCostLimit
    ) {
      throw new HttpException(
        `Estimated execution cost ($${estimatedCostUsd}) exceeds the per-execution limit ($${policy.executionCostLimit}).`,
        HttpStatus.PAYMENT_REQUIRED,
      );
    }

    // Check monthly budget
    if (policy.monthlyBudget) {
      // Calculate spend for the current month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const monthUsage = await this.prisma.billingLedger.aggregate({
        where: {
          workspaceId,
          type: BillingEventType.USAGE,
          createdAt: { gte: startOfMonth },
        },
        _sum: { amountUsd: true },
      });

      const currentSpend = (monthUsage._sum.amountUsd || 0) + estimatedCostUsd;

      if (currentSpend >= policy.monthlyBudget) {
        if (policy.hardCutoff) {
          throw new HttpException(
            `Workspace has exceeded its monthly budget of $${policy.monthlyBudget}. Execution blocked.`,
            HttpStatus.PAYMENT_REQUIRED,
          );
        } else {
          this.logger.warn(
            `Workspace ${workspaceId} exceeded monthly budget but hardCutoff is false.`,
          );
        }
      } else if (
        currentSpend >=
        policy.monthlyBudget * policy.softWarningThreshold
      ) {
        this.logger.warn(
          `Workspace ${workspaceId} is nearing its monthly budget (${Math.round((currentSpend / policy.monthlyBudget) * 100)}%).`,
        );
        // We could also emit an event here to trigger an email warning
      }
    }

    return true;
  }
}
