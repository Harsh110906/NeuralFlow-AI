import { Module } from '@nestjs/common';
import { WorkflowController } from './workflow.controller';
import { WorkflowService } from './workflow.service';
import { WorkflowDoctorService } from './doctor.service';
import { WorkspaceModule } from '../workspace/workspace.module';
import { TemplateModule } from '../template/template.module';

@Module({
  imports: [WorkspaceModule, TemplateModule],
  controllers: [WorkflowController],
  providers: [WorkflowService, WorkflowDoctorService],
})
export class WorkflowModule {}
