import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AgentRouterService {
  constructor(private prisma: PrismaService) {}

  /**
   * Resolves the actual AgentVersion to use for an Agent execution.
   * If there is an active A/B test (Experiment), routes traffic probabilistically.
   * If no experiment is active, returns the latest version.
   * Note: In a high-scale production system, this config would be cached in Redis.
   */
  async resolveAgentVersion(
    agentId: string,
    environment: string = 'DEVELOPMENT',
  ): Promise<string | null> {
    // 1. Check for strict environment release (STAGING, PRODUCTION)
    if (environment !== 'DEVELOPMENT') {
      const release = await this.prisma.agentRelease.findUnique({
        where: {
          agentId_environment: {
            agentId,
            environment,
          },
        },
      });
      if (release) {
        return release.versionId;
      }
    }

    // 2. Check for active experiment (usually runs in DEVELOPMENT or overrides)
    const activeExperiment = await this.prisma.agentExperiment.findFirst({
      where: { agentId, status: 'RUNNING' },
      include: { variants: true },
    });

    if (activeExperiment && activeExperiment.variants.length > 0) {
      // Probabilistic routing based on weights
      const totalWeight = activeExperiment.variants.reduce(
        (sum, v) => sum + v.weight,
        0,
      );
      let randomPoint = Math.random() * totalWeight;

      for (const variant of activeExperiment.variants) {
        randomPoint -= variant.weight;
        if (randomPoint <= 0) {
          // Asynchronous tracking of metrics can be fired via EventBus here
          return variant.versionId;
        }
      }

      // Fallback
      return activeExperiment.variants[0].versionId;
    }

    // No active experiment -> Use latest version
    const latestVersion = await this.prisma.agentVersion.findFirst({
      where: { agentId },
      orderBy: { version: 'desc' },
    });

    return latestVersion ? latestVersion.id : null;
  }
}
