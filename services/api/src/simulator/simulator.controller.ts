import { Controller, Post, Param } from '@nestjs/common';
import { SimulatorService } from './simulator.service';

@Controller('simulator')
export class SimulatorController {
  constructor(private readonly simulatorService: SimulatorService) {}

  @Post('run/:workflowId')
  simulate(@Param('workflowId') workflowId: string) {
    return this.simulatorService.simulateWorkflow(workflowId);
  }
}
