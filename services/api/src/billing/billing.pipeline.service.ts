import { Injectable, Logger } from '@nestjs/common';
import {
  BillingLedgerService,
  BillingEventType,
} from './billing-ledger.service';
import { OutboxService } from '../outbox/outbox.service';
import { PrismaService } from '../prisma/prisma.service';
import { IdempotencyService } from '../reliability/idempotency.service';

@Injectable()
export class BillingPipelineService {
  private readonly logger = new Logger(BillingPipelineService.name);

  constructor(
    private readonly ledgerService: BillingLedgerService,
    private readonly outboxService: OutboxService,
    private readonly prisma: PrismaService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Processes a raw Usage Event.
   * Aggregates usage into a Billing Event, writes to the ledger, and syncs with Stripe.
   */
  async processUsageEvent(
    workspaceId: string,
    executionCostUsd: number,
    metadata: Record<string, any>,
    idempotencyKey: string,
  ) {
    // 0. Prevent duplicate processing
    await this.idempotencyService.checkAndAcquire(idempotencyKey);

    try {
      // 1. Record Usage Event to Durable Ledger & Outbox event for Stripe Sync atomically
      await this.prisma.$transaction(async (tx) => {
        const ledgerEntry = await this.ledgerService.recordEvent(
          workspaceId,
          BillingEventType.USAGE,
          executionCostUsd,
          metadata,
          idempotencyKey,
          tx,
        );

        await this.outboxService.publish(
          'BillingLedger',
          ledgerEntry.id,
          'USAGE_RECORDED',
          {
            workspaceId,
            executionCostUsd,
            ledgerEntryId: ledgerEntry.id,
          },
          tx,
        );
      });

      await this.idempotencyService.markCompleted(idempotencyKey);
      this.logger.log(
        `Recorded usage event for workspace ${workspaceId} via Outbox`,
      );
    } catch (error) {
      await this.idempotencyService.markFailed(idempotencyKey);
      throw error;
    }
  }

  private async syncToStripe(
    workspaceId: string,
    costUsd: number,
    ledgerId: string,
  ) {
    // STUB: Stripe integration
    this.logger.log(
      `[Stripe Stub] Synced $${costUsd} usage for workspace ${workspaceId} (LedgerRef: ${ledgerId})`,
    );
  }
}
