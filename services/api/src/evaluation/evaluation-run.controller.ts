import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { EvaluationRunService } from './evaluation-run.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('evaluation-runs')
@UseGuards(PermissionsGuard)
export class EvaluationRunController {
  constructor(private readonly runService: EvaluationRunService) {}

  @Post()
  @RequirePermissions('evaluations:run')
  async triggerRun(
    @Body()
    body: {
      workspaceId: string;
      datasetVersionId: string;
      agentVersionId: string;
      judgeModel?: string;
    },
  ) {
    if (!body.workspaceId) throw new Error('workspaceId is required');
    return this.runService.runEvaluation(
      body.workspaceId,
      body.datasetVersionId,
      body.agentVersionId,
      body.judgeModel,
    );
  }

  @Post('playground')
  @RequirePermissions('evaluations:run')
  async runPlayground(
    @Body() body: { workspaceId: string; agentVersionId: string; input: any },
  ) {
    if (!body.workspaceId || !body.agentVersionId || !body.input)
      throw new Error('Missing parameters');
    return this.runService.runPlayground(
      body.workspaceId,
      body.agentVersionId,
      body.input,
    );
  }

  @Get()
  @RequirePermissions('evaluations:read')
  async getRuns(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) throw new Error('workspaceId is required');
    return this.runService.getRuns(workspaceId);
  }

  @Get(':id')
  @RequirePermissions('evaluations:read')
  async getRun(@Param('id') id: string) {
    return this.runService.getRun(id);
  }

  @Get(':id/traces')
  @RequirePermissions('evaluations:read')
  async getTraces(@Param('id') id: string, @Req() req: any) {
    const role = req.user?.role || 'MEMBER';
    return this.runService.getTraces(id, role);
  }
}
