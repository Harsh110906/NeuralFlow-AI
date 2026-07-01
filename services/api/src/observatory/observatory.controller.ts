import { Controller, Get, Param, Post } from '@nestjs/common';
import { ObservatoryService } from './observatory.service';
import { WorkflowDoctorService } from './workflow-doctor.service';
// import { RolesGuard, Roles } from '../auth/roles.guard';
// import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('observatory')
// @UseGuards(WorkspaceGuard, RolesGuard)
export class ObservatoryController {
  constructor(
    private readonly observatoryService: ObservatoryService,
    private readonly doctorService: WorkflowDoctorService,
  ) {}

  @Get('metrics/:workspaceId')
  // @Roles('ADMIN', 'MEMBER')
  getMetrics(@Param('workspaceId') workspaceId: string) {
    return this.observatoryService.getWorkspaceMetrics(workspaceId);
  }

  @Get('executions/:workspaceId')
  // @Roles('ADMIN', 'MEMBER')
  getRecentExecutions(@Param('workspaceId') workspaceId: string) {
    return this.observatoryService.getRecentExecutions(workspaceId);
  }

  @Get('executions/:workspaceId/:executionId')
  // @Roles('ADMIN', 'MEMBER')
  getExecutionDetail(
    @Param('workspaceId') workspaceId: string,
    @Param('executionId') executionId: string,
  ) {
    return this.observatoryService.getExecutionDetail(workspaceId, executionId);
  }

  // Doctor/Analysis Endpoints below

  @Post('doctor/failure/:executionId')
  analyzeFailure(@Param('executionId') executionId: string) {
    return this.doctorService.analyzeFailure(executionId);
  }

  @Post('doctor/cost/:executionId')
  analyzeCost(@Param('executionId') executionId: string) {
    return this.doctorService.analyzeCost(executionId);
  }

  @Post('doctor/architecture/:workflowId')
  analyzeArchitecture(@Param('workflowId') workflowId: string) {
    return this.doctorService.analyzeArchitecture(workflowId);
  }

  @Get('doctor/health/:workflowId')
  async getHealthScore(@Param('workflowId') workflowId: string) {
    const score = await this.doctorService.calculateHealthScore(workflowId);
    return { score };
  }
}
