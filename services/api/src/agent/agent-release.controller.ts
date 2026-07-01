import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AgentReleaseService } from './agent-release.service';
import { RequirePermissions } from '../auth/permissions.decorator';
import { PermissionsGuard } from '../auth/permissions.guard';

@Controller('agents')
@UseGuards(PermissionsGuard)
export class AgentReleaseController {
  constructor(private readonly releaseService: AgentReleaseService) {}

  @Get(':id/releases')
  @RequirePermissions('releases:read')
  async getReleases(@Param('id') id: string) {
    return this.releaseService.getReleases(id);
  }

  @Post(':id/releases')
  @RequirePermissions('releases:write')
  async promoteVersion(
    @Param('id') agentId: string,
    @Body()
    body: {
      versionId: string;
      environment: string;
      bypassEvaluationCheck?: boolean;
    },
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.releaseService.promoteVersion(
      agentId,
      body.versionId,
      body.environment,
      userId,
      body.bypassEvaluationCheck,
    );
  }

  @Post(':id/releases/rollback')
  @RequirePermissions('releases:write')
  async rollbackVersion(
    @Param('id') agentId: string,
    @Body() body: { versionId: string; environment: string },
    @Req() req: any,
  ) {
    const userId = req.user?.id || 'system';
    return this.releaseService.rollbackToVersion(
      agentId,
      body.environment,
      body.versionId,
      userId,
    );
  }
}
