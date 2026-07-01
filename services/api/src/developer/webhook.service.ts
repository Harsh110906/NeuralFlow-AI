import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const MAX_RETRIES = 5;
const BASE_RETRY_DELAY_MS = 2000; // 2 seconds base

@Injectable()
export class WebhookService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WebhookService.name);
  private workerInterval: NodeJS.Timeout;
  private isProcessing = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.workerInterval = setInterval(() => this.processRetries(), 5000);
  }

  onModuleDestroy() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
    }
  }

  async dispatchEvent(workspaceId: string, eventType: string, payload: any) {
    const subscriptions = await this.prisma.webhookSubscription.findMany({
      where: { workspaceId, active: true },
    });

    // Filter by events manually or add to query
    const activeSubs = subscriptions.filter(
      (s) => s.events.includes(eventType) || s.events.includes('*'),
    );
    if (!activeSubs.length) return;

    const deliveryId = uuidv4();
    const redactedPayload = this.redactPayload(payload);
    const payloadStr = JSON.stringify(redactedPayload);

    for (const sub of activeSubs) {
      if (!sub.endpointUrl.startsWith('https://')) {
        this.logger.warn(
          `Skipping non-HTTPS webhook endpoint: ${sub.endpointUrl}`,
        );
        continue;
      }

      await this.prisma.webhookDeliveryLog.create({
        data: {
          subscriptionId: sub.id,
          deliveryId,
          eventType,
          payloadSnapshot: payloadStr,
          success: false,
          attempts: 0,
          nextRetryAt: new Date(),
        },
      });
    }
  }

  private async processRetries() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      const pendingLogs = await this.prisma.webhookDeliveryLog.findMany({
        where: {
          success: false,
          nextRetryAt: { lte: new Date() },
          attempts: { lt: MAX_RETRIES },
        },
        include: { subscription: true },
        take: 50,
      });

      for (const log of pendingLogs) {
        await this.attemptDelivery(log);
      }
    } catch (err) {
      this.logger.error('Error in webhook retry worker', err);
    } finally {
      this.isProcessing = false;
    }
  }

  private async attemptDelivery(log: any) {
    const { subscription } = log;
    const attemptNum = log.attempts + 1;
    let success = false;
    let status: number | null = null;
    let errorMessage: string | null = null;

    const timestamp = Date.now().toString();
    const signature = this.generateSignature(
      log.payloadSnapshot,
      subscription.secret,
      timestamp,
    );

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(subscription.endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-NeuralFlow-Delivery': log.deliveryId,
          'X-NeuralFlow-Event': log.eventType,
          'X-NeuralFlow-Timestamp': timestamp,
          'X-NeuralFlow-Signature': signature,
        },
        body: log.payloadSnapshot,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      status = res.status;
      if (res.ok) {
        success = true;
      } else {
        errorMessage = `HTTP ${status}`;
      }
    } catch (err: any) {
      errorMessage = err.message || 'Connection failed';
    }

    const nextRetryAt =
      success || attemptNum >= MAX_RETRIES
        ? null
        : new Date(Date.now() + BASE_RETRY_DELAY_MS * Math.pow(2, attemptNum));

    await this.prisma.webhookDeliveryLog.update({
      where: { id: log.id },
      data: {
        success,
        attempts: attemptNum,
        responseStatus: status,
        errorMessage,
        nextRetryAt,
      },
    });
  }

  public verifySignature(
    payloadStr: string,
    secret: string,
    timestamp: string,
    receivedSignature: string,
  ): boolean {
    const expected = this.generateSignature(payloadStr, secret, timestamp);
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(receivedSignature, 'hex');

    if (expectedBuffer.length !== receivedBuffer.length) return false;
    return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
  }

  private generateSignature(
    payloadStr: string,
    secret: string,
    timestamp: string,
  ): string {
    const data = `${timestamp}.${payloadStr}`;
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  private redactPayload(payload: any): any {
    if (typeof payload !== 'object' || payload === null) return payload;
    if (Array.isArray(payload))
      return payload.map((item) => this.redactPayload(item));

    const redacted = { ...payload };
    const sensitiveKeys = [
      'secret',
      'password',
      'token',
      'apikey',
      'authorization',
    ];

    for (const key of Object.keys(redacted)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof redacted[key] === 'object') {
        redacted[key] = this.redactPayload(redacted[key]);
      }
    }
    return redacted;
  }
}
