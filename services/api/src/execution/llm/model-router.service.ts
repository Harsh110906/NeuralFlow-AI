import { Injectable } from '@nestjs/common';
import { ModelRegistryService } from './model-registry.service';
import { TelemetryService } from '../../observatory/telemetry.service';

export type TaskComplexity = 'SIMPLE' | 'COMPLEX' | 'MASSIVE_CONTEXT';

@Injectable()
export class ModelRouterService {
  constructor(
    private registry: ModelRegistryService,
    private telemetryService: TelemetryService,
  ) {}

  route(
    requestedModel: string | undefined,
    taskComplexity: TaskComplexity = 'COMPLEX',
    forceSelection: boolean = false,
  ): string {
    if (forceSelection && requestedModel) {
      // Record routing decision
      this.telemetryService.recordEvent({
        eventId: require('crypto').randomUUID(),
        workspaceId: 'system', // Ideally we'd have workspaceId passed in
        eventType: 'MODEL_ROUTING',
        timestamp: new Date(),
        durationMs: 0,
        costUsd: 0,
        tokenUsage: 0,
        metadata: {
          requestedModel,
          taskComplexity,
          forceSelection,
          finalModel: requestedModel,
        },
      });
      return requestedModel;
    }

    // Auto-select mode
    const bestModel = this.registry.getBestModelForTask(taskComplexity);

    this.telemetryService.recordEvent({
      eventId: require('crypto').randomUUID(),
      workspaceId: 'system',
      eventType: 'MODEL_ROUTING',
      timestamp: new Date(),
      durationMs: 0,
      costUsd: 0,
      tokenUsage: 0,
      metadata: {
        requestedModel,
        taskComplexity,
        forceSelection,
        finalModel: bestModel,
      },
    });

    return bestModel;
  }
}
