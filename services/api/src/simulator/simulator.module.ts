import { Module } from '@nestjs/common';
import { SimulatorService } from './simulator.service';
import { SimulatorController } from './simulator.controller';
import { ExecutionModule } from '../execution/execution.module';
import { AgentModule } from '../agent/agent.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ExecutionModule, AgentModule],
  controllers: [SimulatorController],
  providers: [SimulatorService],
})
export class SimulatorModule {}
