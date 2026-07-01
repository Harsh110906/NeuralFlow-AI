import { Module, forwardRef } from '@nestjs/common';
import { SystemHealthController } from './system-health.controller';
import { SystemHealthService } from './system-health.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ExecutionModule } from '../execution/execution.module';

@Module({
  imports: [PrismaModule, forwardRef(() => ExecutionModule)],
  controllers: [SystemHealthController],
  providers: [SystemHealthService],
})
export class HealthModule {}
