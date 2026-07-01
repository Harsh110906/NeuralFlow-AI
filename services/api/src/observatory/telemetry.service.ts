import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CanonicalTelemetryEvent {
  eventId: string;
  workspaceId: string;
  executionId?: string;
  nodeId?: string;
  eventType: string; // 'EXECUTION', 'LLM', 'CONNECTOR'
  timestamp: Date;
  durationMs: number;
  costUsd: number;
  tokenUsage: number;
  metadata: any;
}

export interface ExecutionMetric {
  workspaceId: string;
  executionId: string;
  latencyMs: number;
  queueWaitMs?: number;
  retryCount?: number;
  success: boolean;
  metadata?: any;
}

export interface LlmMetric {
  workspaceId: string;
  provider: string;
  model: string;
  tokenUsage: number;
  costUsd: number;
  latencyMs: number;
  success: boolean;
  metadata?: any;
}

export interface ConnectorMetric {
  workspaceId: string;
  connectorId: string;
  action: string;
  latencyMs: number;
  success: boolean;
  metadata?: any;
}

@Injectable()
export class TelemetryService {
  constructor(private prisma: PrismaService) {}

  async recordExecutionMetric(metric: ExecutionMetric) {
    return this.recordEvent({
      eventId: require('crypto').randomUUID(),
      workspaceId: metric.workspaceId,
      executionId: metric.executionId,
      eventType: 'EXECUTION',
      timestamp: new Date(),
      durationMs: metric.latencyMs,
      costUsd: 0,
      tokenUsage: 0,
      metadata: {
        queueWaitMs: metric.queueWaitMs,
        retryCount: metric.retryCount,
        success: metric.success,
        ...metric.metadata,
      },
    });
  }

  async recordLlmMetric(metric: LlmMetric) {
    return this.recordEvent({
      eventId: require('crypto').randomUUID(),
      workspaceId: metric.workspaceId,
      eventType: 'LLM',
      timestamp: new Date(),
      durationMs: metric.latencyMs,
      costUsd: metric.costUsd,
      tokenUsage: metric.tokenUsage,
      metadata: {
        provider: metric.provider,
        model: metric.model,
        success: metric.success,
        ...metric.metadata,
      },
    });
  }

  async recordConnectorMetric(metric: ConnectorMetric) {
    return this.recordEvent({
      eventId: require('crypto').randomUUID(),
      workspaceId: metric.workspaceId,
      eventType: 'CONNECTOR',
      timestamp: new Date(),
      durationMs: metric.latencyMs,
      costUsd: 0,
      tokenUsage: 0,
      metadata: {
        connectorId: metric.connectorId,
        action: metric.action,
        success: metric.success,
        ...metric.metadata,
      },
    });
  }

  async recordEvent(event: CanonicalTelemetryEvent) {
    // 1. Write to Postgres
    if (event.executionId) {
      await this.prisma.executionEvent
        .create({
          data: {
            id: event.eventId,
            executionId: event.executionId,
            type: event.eventType,
            nodeId: event.nodeId,
            data: event.metadata,
            totalTokens: event.tokenUsage,
            estimatedCost: event.costUsd,
            createdAt: event.timestamp,
          },
        })
        .catch((err) => console.error('Postgres Telemetry Error:', err));
    }

    // 2. Write to ClickHouse (Simulated Dual-Write)
    this.pushToClickHouse(event).catch(console.error);
  }

  private async pushToClickHouse(event: CanonicalTelemetryEvent) {
    // Simulate ClickHouse insertion
  }
}
