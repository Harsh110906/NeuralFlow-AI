import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeatureFlagService {
  private readonly logger = new Logger(FeatureFlagService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Initializes default flags if they do not exist
   */
  async initializeDefaultFlags() {
    const defaults = [
      {
        key: 'marketplace_enabled',
        name: 'Marketplace',
        enabled: true,
        type: 'RELEASE',
        owner: 'system',
      },
      {
        key: 'agent_teams_enabled',
        name: 'Agent Teams',
        enabled: false,
        type: 'EXPERIMENT',
        owner: 'system',
      },
      {
        key: 'hitl_enabled',
        name: 'Human-in-the-Loop',
        enabled: true,
        type: 'RELEASE',
        owner: 'system',
      },
      {
        key: 'evaluation_lab_enabled',
        name: 'Evaluation Lab',
        enabled: true,
        type: 'RELEASE',
        owner: 'system',
      },
      {
        key: 'experimental_models_enabled',
        name: 'Experimental Models',
        enabled: false,
        type: 'EXPERIMENT',
        owner: 'system',
      },
      {
        key: 'enterprise_features_enabled',
        name: 'Enterprise Features',
        enabled: false,
        type: 'RELEASE',
        owner: 'system',
      },
    ];

    for (const flag of defaults) {
      await this.prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: {},
        create: {
          key: flag.key,
          name: flag.name,
          enabled: flag.enabled,
          type: flag.type,
          owner: flag.owner,
        },
      });
    }
  }

  async getAllFlags() {
    return this.prisma.featureFlag.findMany({
      include: { overrides: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateFlag(
    id: string,
    data: { enabled?: boolean; owner?: string; expiresAt?: Date },
  ) {
    return this.prisma.featureFlag.update({
      where: { id },
      data,
    });
  }

  async setOverride(
    flagId: string,
    targetType: string,
    targetId: string,
    enabled: boolean,
  ) {
    return this.prisma.featureFlagOverride.upsert({
      where: { flagId_targetType_targetId: { flagId, targetType, targetId } },
      update: { enabled },
      create: { flagId, targetType, targetId, enabled },
    });
  }

  async removeOverride(overrideId: string) {
    return this.prisma.featureFlagOverride.delete({
      where: { id: overrideId },
    });
  }

  /**
   * Evaluates whether a feature is enabled for a given context (workspace or user)
   */
  async isEnabled(
    key: string,
    workspaceId?: string,
    userId?: string,
  ): Promise<boolean> {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { key },
      include: { overrides: true },
    });

    if (!flag) return false;

    // Check expiration if it's a temporary flag
    if (flag.expiresAt && new Date() > flag.expiresAt) {
      return false; // Expired flags default to false
    }

    // Check specific user override first (highest priority)
    if (userId) {
      const userOverride = flag.overrides.find(
        (o) => o.targetType === 'USER' && o.targetId === userId,
      );
      if (userOverride) return userOverride.enabled;
    }

    // Check workspace override second
    if (workspaceId) {
      const workspaceOverride = flag.overrides.find(
        (o) => o.targetType === 'WORKSPACE' && o.targetId === workspaceId,
      );
      if (workspaceOverride) return workspaceOverride.enabled;
    }

    // Fall back to global flag state
    return flag.enabled;
  }
}
