import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { FeatureFlagService } from './feature-flag.service';

@Controller('feature-flags')
export class FeatureFlagController {
  constructor(private readonly featureFlagService: FeatureFlagService) {}

  @Get()
  async getFlags() {
    return this.featureFlagService.getAllFlags();
  }

  @Put(':id')
  async updateFlag(
    @Param('id') id: string,
    @Body() body: { enabled?: boolean; owner?: string; expiresAt?: Date },
  ) {
    return this.featureFlagService.updateFlag(id, body);
  }

  @Post(':id/overrides')
  async setOverride(
    @Param('id') flagId: string,
    @Body() body: { targetType: string; targetId: string; enabled: boolean },
  ) {
    return this.featureFlagService.setOverride(
      flagId,
      body.targetType,
      body.targetId,
      body.enabled,
    );
  }

  @Delete('overrides/:id')
  async removeOverride(@Param('id') id: string) {
    return this.featureFlagService.removeOverride(id);
  }

  // Debug/Test Endpoint to check resolution
  @Get('evaluate/:key')
  async evaluate(
    @Param('key') key: string,
    @Query('workspaceId') workspaceId?: string,
    @Query('userId') userId?: string,
  ) {
    const enabled = await this.featureFlagService.isEnabled(
      key,
      workspaceId,
      userId,
    );
    return { key, enabled, workspaceId, userId };
  }
}
