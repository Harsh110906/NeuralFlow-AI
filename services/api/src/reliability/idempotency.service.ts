import { Injectable, Logger, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
  private readonly logger = new Logger(IdempotencyService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tracks an idempotency key to prevent duplicate operations.
   * If the key already exists and the operation was completed, it throws a ConflictException.
   * If the key is new, it creates a record with a PENDING state.
   *
   * In a real production system, this would typically use Redis with a TTL.
   * For Phase 10 Beta, we will simulate this by storing in Postgres or using a simple Map/Cache
   * depending on the schema. Since IdempotencyKey isn't in schema, we will use a naive Map for Beta
   * or a simple Redis mock. Let's use an in-memory Map for the beta baseline, as requested for fast fail.
   */

  private idempotencyStore = new Map<
    string,
    { status: 'PENDING' | 'COMPLETED'; result?: any; timestamp: number }
  >();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  async checkAndAcquire(key: string): Promise<void> {
    this.cleanUp();

    const record = this.idempotencyStore.get(key);

    if (record) {
      if (record.status === 'COMPLETED') {
        throw new ConflictException(
          `Operation with idempotency key ${key} has already been completed.`,
        );
      } else if (record.status === 'PENDING') {
        throw new ConflictException(
          `Operation with idempotency key ${key} is currently in progress.`,
        );
      }
    }

    this.idempotencyStore.set(key, {
      status: 'PENDING',
      timestamp: Date.now(),
    });
  }

  async markCompleted(key: string, result?: any): Promise<void> {
    const record = this.idempotencyStore.get(key);
    if (record) {
      record.status = 'COMPLETED';
      record.result = result;
    }
  }

  async markFailed(key: string): Promise<void> {
    // If it failed, we can remove the key so it can be retried safely.
    this.idempotencyStore.delete(key);
  }

  private cleanUp() {
    const now = Date.now();
    for (const [key, value] of this.idempotencyStore.entries()) {
      if (now - value.timestamp > this.TTL_MS) {
        this.idempotencyStore.delete(key);
      }
    }
  }
}
