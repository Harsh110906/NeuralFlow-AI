import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowDoctorService } from './doctor.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { CreateWorkflowDto } from './dto/create-workflow.dto';
import { TemplateRegistry } from '../template/template.registry';
import { ExecutionService } from '../execution/execution.service';
// import { RolesGuard, Roles } from '../auth/roles.guard';
// import { WorkspaceGuard } from '../auth/workspace.guard';

@Controller('workflows')
// @UseGuards(WorkspaceGuard, RolesGuard)
export class WorkflowController {
  constructor(
    private readonly workflowService: WorkflowService,
    private readonly doctorService: WorkflowDoctorService,
    private readonly executionService: ExecutionService,
  ) {}

  @Get('templates/beta')
  getBetaTemplates() {
    return TemplateRegistry.getBetaTemplates();
  }

  @Get()
  // @Roles('ADMIN', 'MEMBER')
  getWorkflows(@Query('workspaceId') workspaceId: string) {
    if (!workspaceId) return [];
    return this.workflowService.getWorkflowsByWorkspace(workspaceId);
  }

  @Get(':id')
  // @Roles('ADMIN', 'MEMBER')
  getWorkflow(@Param('id') id: string) {
    return this.workflowService.getWorkflow(id);
  }

  @Post()
  // @Roles('ADMIN', 'MEMBER')
  createWorkflow(@Body() body: CreateWorkflowDto) {
    return this.workflowService.createWorkflow(body);
  }

  @Put(':id')
  // @Roles('ADMIN', 'MEMBER')
  updateWorkflow(@Param('id') id: string, @Body() body: UpdateWorkflowDto) {
    return this.workflowService.updateWorkflow(id, body);
  }

  @Post(':id/doctor')
  // @Roles('ADMIN', 'MEMBER')
  runDoctor(
    @Param('id') id: string,
    @Query('workspaceId') workspaceId: string,
    @Body() body: { dagJson: any },
  ) {
    if (!workspaceId)
      throw new Error('Workspace ID is required for doctor analysis');
    return this.doctorService.analyzeWorkflow(workspaceId, body.dagJson);
  }

  @Post(':id/execute')
  // @Roles('ADMIN', 'MEMBER')
  async executeWorkflow(@Param('id') id: string) {
    return this.executionService.startExecution(id);
  }
}
