import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EvaluationDatasetService } from './evaluation-dataset.service';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';

@Controller('evaluation-datasets')
@UseGuards(PermissionsGuard)
export class EvaluationDatasetController {
  constructor(private readonly datasetService: EvaluationDatasetService) {}

  @Post()
  @RequirePermissions('evaluations:manage')
  async createDataset(
    @Body() body: { workspaceId: string; name: string; description?: string },
  ) {
    return this.datasetService.createDataset(
      body.workspaceId,
      body.name,
      body.description,
    );
  }

  @Get()
  @RequirePermissions('evaluations:read')
  async getDatasets(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) throw new Error('workspaceId is required');
    return this.datasetService.getDatasets(workspaceId);
  }

  @Get(':id')
  @RequirePermissions('evaluations:read')
  async getDataset(@Param('id') id: string) {
    return this.datasetService.getDataset(id);
  }

  @Post(':id/versions')
  @RequirePermissions('evaluations:manage')
  async createDatasetVersion(
    @Param('id') datasetId: string,
    @Body() body: { description: string; testCases: any[] },
  ) {
    return this.datasetService.createDatasetVersion(
      datasetId,
      body.description,
      body.testCases,
    );
  }

  @Get(':id/versions')
  @RequirePermissions('evaluations:read')
  async getDatasetVersions(@Param('id') datasetId: string) {
    return this.datasetService.getDatasetVersions(datasetId);
  }

  @Get('versions/:versionId/testcases')
  @RequirePermissions('evaluations:read')
  async getTestCases(@Param('versionId') versionId: string) {
    return this.datasetService.getTestCases(versionId);
  }
}
