import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

export enum BillingEventType {
  USAGE = 'USAGE',
  INVOICE = 'INVOICE',
  SUBSCRIPTION = 'SUBSCRIPTION',
  REFUND = 'REFUND',
  CHARGEBACK = 'CHARGEBACK',
  ADJUSTMENT = 'ADJUSTMENT',
}

@Injectable()
export class BillingLedgerService {
  constructor(private prisma: PrismaService) {}

  async recordEvent(
    workspaceId: string,
    type: BillingEventType,
    amountUsd: number,
    metadata?: Record<string, any>,
    idempotencyKey?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    if (idempotencyKey) {
      const existing = await prisma.billingLedger.findUnique({
        where: { idempotencyKey },
      });
      if (existing) {
        return existing;
      }
    }

    return prisma.billingLedger.create({
      data: {
        workspaceId,
        type,
        amountUsd,
        idempotencyKey,
        metadata: metadata || {},
      },
    });
  }

  async getLedgerHistory(workspaceId: string) {
    return this.prisma.billingLedger.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getBalance(workspaceId: string) {
    const ledgers = await this.prisma.billingLedger.findMany({
      where: { workspaceId },
    });

    let balance = 0;
    for (const entry of ledgers) {
      if (
        entry.type === BillingEventType.USAGE ||
        entry.type === BillingEventType.CHARGEBACK ||
        entry.type === BillingEventType.REFUND
      ) {
        balance -= entry.amountUsd;
      } else if (
        entry.type === BillingEventType.INVOICE ||
        entry.type === BillingEventType.SUBSCRIPTION ||
        entry.type === BillingEventType.ADJUSTMENT
      ) {
        balance += entry.amountUsd;
      }
    }

    return balance;
  }
}
