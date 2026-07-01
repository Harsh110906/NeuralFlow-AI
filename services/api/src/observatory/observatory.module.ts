import { Module, forwardRef } from '@nestjs/common';
import { ObservatoryController } from './observatory.controller';
import { ObservatoryService } from './observatory.service';
import { WorkflowDoctorService } from './workflow-doctor.service';
import { TelemetryService } from './telemetry.service';
import { TracingService } from './tracing.service';
import { ExecutionModule } from '../execution/execution.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ExecutionModule)],
  controllers: [ObservatoryController],
  providers: [
    ObservatoryService,
    WorkflowDoctorService,
    TelemetryService,
    TracingService,
  ],
  exports: [
    ObservatoryService,
    WorkflowDoctorService,
    TelemetryService,
    TracingService,
  ],
})
export class ObservatoryModule {}
