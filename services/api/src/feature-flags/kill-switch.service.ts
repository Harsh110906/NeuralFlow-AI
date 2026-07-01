import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';

export enum KillSwitchSystem {
  MARKETPLACE = 'ks_marketplace',
  AGENT_TEAMS = 'ks_agent_teams',
  BILLING = 'ks_billing',
  LLM_ROUTING = 'ks_llm_routing',
  EXECUTION = 'ks_execution',
}

@Injectable()
export class KillSwitchService {
  private readonly logger = new Logger(KillSwitchService.name);

  constructor(private readonly featureFlagService: FeatureFlagService) {}

  /**
   * Checks if a kill switch is active for a specific subsystem.
   * Kill switches are "active" if the underlying feature flag is enabled.
   * If active, it throws a 503 Service Unavailable.
   */
  async check(system: KillSwitchSystem): Promise<void> {
    const isKilled = await this.featureFlagService.isEnabled(system);
    if (isKilled) {
      this.logger.warn(`Kill switch activated for subsystem: ${system}`);
      throw new HttpException(
        `System temporarily unavailable due to active kill switch: ${system}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Returns a boolean indicating if the kill switch is active, without throwing an error.
   */
  async isActive(system: KillSwitchSystem): Promise<boolean> {
    return this.featureFlagService.isEnabled(system);
  }
}
