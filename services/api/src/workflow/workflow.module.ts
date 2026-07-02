import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowDoctorService } from './doctor.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { TemplateModule } from '../template/template.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [WorkspaceModule, TemplateModule, ExecutionModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowDoctorService],
})
export class WorkflowModule {}
