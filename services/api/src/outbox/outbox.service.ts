import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OutboxService {
  private readonly logger = new Logger(OutboxService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publishes an event to the outbox table inside a transaction.
   * This guarantees that the event is only published if the business transaction succeeds.
   */
  async publish(
    aggregateType: string,
    aggregateId: string,
    eventType: string,
    payload: any,
    tx?: Prisma.TransactionClient,
  ) {
    const prisma = tx || this.prisma;

    await prisma.outboxEvent.create({
      data: {
        aggregateType,
        aggregateId,
        eventType,
        payload,
        status: 'PENDING',
      },
    });

    // In a real implementation, you would often trigger an async worker here to process the outbox immediately.
    // For now, it will be swept by a background job.
    this.logger.debug(
      `Outbox event created: ${eventType} for ${aggregateType} ${aggregateId}`,
    );
  }
}
