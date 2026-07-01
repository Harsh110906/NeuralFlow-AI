import { Module, forwardRef } from '@nestjs/common';
import { AgentController } from './agent.controller';
import { AgentReleaseController } from './agent-release.controller';
import { AgentService } from './agent.service';
import { AgentReleaseService } from './agent-release.service';
import { ExecutionModule } from '../execution/execution.module';
import { MemoryModule } from '../memory/memory.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { EvaluationModule } from '../evaluation/evaluation.module';

@Module({
  imports: [
    forwardRef(() => ExecutionModule),
    MemoryModule,
    PrismaModule,
    AuthModule,
    EvaluationModule,
  ],
  controllers: [AgentController, AgentReleaseController],
  providers: [AgentService, AgentReleaseService],
  exports: [AgentService, AgentReleaseService],
})
export class AgentModule {}
