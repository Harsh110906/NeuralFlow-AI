import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { ExecutionService } from './execution.service';

@Controller('executions')
export class ExecutionController {
  constructor(private readonly executionService: ExecutionService) {}

  @Post('start/:workflowId')
  startExecution(@Param('workflowId') workflowId: string) {
    return this.executionService.startExecution(workflowId);
  }

  @Post(':id/stop')
  async stopExecution(@Param('id') id: string) {
    return { status: 'Not implemented (Requires Temporal cancellation)' };
  }

  @Get(':executionId')
  getExecution(@Param('executionId') executionId: string) {
    return this.executionService.getExecution(executionId);
  }

  @Get('workflow/:workflowId')
  getExecutionsForWorkflow(@Param('workflowId') workflowId: string) {
    return this.executionService.getExecutionsForWorkflow(workflowId);
  }
}
