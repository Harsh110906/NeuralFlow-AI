import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Client } from '@temporalio/client';
import { CostGuardService } from '../billing/cost-guard.service';
import { TelemetryService } from '../observatory/telemetry.service';

@Injectable()
export class ExecutionService {
  constructor(
    private prisma: PrismaService,
    @Inject('TEMPORAL_CLIENT') private temporalClient: Client,
    private costGuard: CostGuardService,
    private telemetryService: TelemetryService,
  ) {}

  async startExecution(workflowId: string) {
    const workflow = await this.prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${workflowId} not found`);
    }

    if (!workflow.dagJson) {
      throw new Error(`Workflow ${workflowId} has no DAG structure configured`);
    }

    // Cost Guard: Check if the workspace has sufficient budget to execute a workflow
    await this.costGuard.checkBudget(workflow.workspaceId);

    // Create execution record
    const execution = await this.prisma.execution.create({
      data: {
        workflowId,
        status: 'PENDING',
      },
    });

    // Start Temporal Workflow
    await this.temporalClient.workflow.start('executeWorkflowDAG', {
      args: [execution.id, workflowId, workflow.dagJson],
      taskQueue: 'neuralflow-execution-queue',
      workflowId: `execution-${execution.id}`,
    });

    // Record Telemetry
    await this.telemetryService.recordExecutionMetric({
      workspaceId: workflow.workspaceId,
      executionId: execution.id,
      latencyMs: 0,
      success: true,
      metadata: { event: 'EXECUTION_STARTED', workflowId },
    });

    return execution;
  }

  async getExecution(executionId: string) {
    const execution = await this.prisma.execution.findUnique({
      where: { id: executionId },
      include: { events: { orderBy: { createdAt: 'asc' } } },
    });

    if (!execution) {
      throw new NotFoundException(`Execution ${executionId} not found`);
    }

    return execution;
  }

  async getExecutionsForWorkflow(workflowId: string) {
    return this.prisma.execution.findMany({
      where: { workflowId },
      orderBy: { createdAt: 'desc' },
      include: { events: true },
    });
  }
}
