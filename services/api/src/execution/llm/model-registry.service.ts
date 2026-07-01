import { Injectable } from '@nestjs/common';

export interface ModelTelemetry {
  costPer1kTokens: number;
  latencyMs: number;
  contextWindow: number;
  reliabilityScore: number;
  historicalSuccessRate: number;
}

@Injectable()
export class ModelRegistryService {
  private registry = new Map<string, ModelTelemetry>([
    [
      'gpt-4o-mini',
      {
        costPer1kTokens: 0.00015,
        latencyMs: 800,
        contextWindow: 128000,
        reliabilityScore: 0.99,
        historicalSuccessRate: 0.98,
      },
    ],
    [
      'claude-3-5-sonnet-20240620',
      {
        costPer1kTokens: 0.003,
        latencyMs: 2500,
        contextWindow: 200000,
        reliabilityScore: 0.98,
        historicalSuccessRate: 0.96,
      },
    ],
    [
      'gpt-4o',
      {
        costPer1kTokens: 0.005,
        latencyMs: 2000,
        contextWindow: 128000,
        reliabilityScore: 0.99,
        historicalSuccessRate: 0.97,
      },
    ],
    [
      'gemini-1.5-pro',
      {
        costPer1kTokens: 0.0035,
        latencyMs: 3000,
        contextWindow: 2000000,
        reliabilityScore: 0.95,
        historicalSuccessRate: 0.94,
      },
    ],
  ]);

  getTelemetry(model: string): ModelTelemetry | undefined {
    return this.registry.get(model);
  }

  updateTelemetry(model: string, metrics: Partial<ModelTelemetry>) {
    const existing = this.registry.get(model);
    if (existing) {
      this.registry.set(model, { ...existing, ...metrics });
    }
  }

  getBestModelForTask(
    taskComplexity: 'SIMPLE' | 'COMPLEX' | 'MASSIVE_CONTEXT',
  ): string {
    if (taskComplexity === 'SIMPLE') return 'gpt-4o-mini';
    if (taskComplexity === 'MASSIVE_CONTEXT') return 'gemini-1.5-pro';
    return 'claude-3-5-sonnet-20240620';
  }
}
