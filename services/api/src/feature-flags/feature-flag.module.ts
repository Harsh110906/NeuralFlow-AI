import { Module, OnModuleInit } from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';
import { FeatureFlagController } from './feature-flag.controller';
import { KillSwitchService } from './kill-switch.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeatureFlagController],
  providers: [FeatureFlagService, KillSwitchService],
  exports: [FeatureFlagService, KillSwitchService],
})
export class FeatureFlagModule implements OnModuleInit {
  constructor(private featureFlagService: FeatureFlagService) {}

  async onModuleInit() {
    await this.featureFlagService.initializeDefaultFlags();
  }
}
