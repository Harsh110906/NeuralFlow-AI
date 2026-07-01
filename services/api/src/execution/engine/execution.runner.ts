import { Injectable, Inject } from '@nestjs/common';
import { ExecutionLogger } from './execution.logger';
import { ExecutionStateManager } from './execution.state-manager';
import { NodeExecutor, NodeExecutorContext } from '../interfaces/node.executor';
import { TriggerNodeExecutor } from '../executors/trigger-node.executor';
import { AgentNodeExecutor } from '../executors/agent-node.executor';
import { ToolNodeExecutor } from '../executors/tool-node.executor';
import { LogicNodeExecutor } from '../executors/logic-node.executor';
import { HumanApprovalNodeExecutor } from '../executors/human-approval-node.executor';
import { PrismaService } from '../../prisma/prisma.service';
import {
  BillingLedgerService,
  BillingEventType,
} from '../../billing/billing-ledger.service';

@Injectable()
export class ExecutionRunner {
  constructor(
    private logger: ExecutionLogger,
    private stateManager: ExecutionStateManager,
    private triggerExecutor: TriggerNodeExecutor,
    private agentExecutor: AgentNodeExecutor,
    private toolExecutor: ToolNodeExecutor,
    private logicExecutor: LogicNodeExecutor,
    private humanApprovalExecutor: HumanApprovalNodeExecutor,
    private prisma: PrismaService,
    private billingLedger: BillingLedgerService,
  ) {}

  async run(executionId: string, workflowId: string, dagJson: any) {
    try {
      await this.stateManager.updateStatus(executionId, 'RUNNING');
      await this.logger.logEvent(executionId, 'EXECUTION_STARTED');

      const nodes: any[] = dagJson.nodes || [];
      const edges: any[] = dagJson.edges || [];

      // Validate Graph
      const triggerNodes = nodes.filter((n) => n.type === 'trigger');
      if (triggerNodes.length !== 1) {
        throw new Error('Graph must contain exactly one trigger node.');
      }

      const triggerNode = triggerNodes[0];
      let currentNode = triggerNode;
      const inputs: Record<string, any> = {};

      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
      });
      if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
      const workspaceId = workflow.workspaceId;

      let stepIndex = 0;

      // Basic linear/sequential traversal for Phase 4
      while (currentNode) {
        await this.logger.logEvent(
          executionId,
          'NODE_STARTED',
          currentNode.id,
          { type: currentNode.type },
        );

        const context: NodeExecutorContext = {
          executionId,
          workflowId,
          nodeId: currentNode.id,
          nodeData: currentNode.data,
          inputs,
        };

        const executor = this.getExecutor(currentNode.type);
        if (!executor) {
          throw new Error(`Unsupported node type: ${currentNode.type}`);
        }

        const result = await executor.execute(context);

        if (result.status === 'FAILED') {
          await this.logger.logEvent(
            executionId,
            'NODE_FAILED',
            currentNode.id,
            { error: result.error },
          );
          throw new Error(`Node ${currentNode.id} failed: ${result.error}`);
        }

        if (result.status === 'PAUSED') {
          await this.logger.logEvent(
            executionId,
            'NODE_PAUSED',
            currentNode.id,
            { output: result.output },
          );
          await this.stateManager.updateStatus(
            executionId,
            'AWAITING_APPROVAL',
          );

          // Create the pending ApprovalRequest
          await this.prisma.approvalRequest.create({
            data: {
              workspaceId,
              executionId,
              nodeId: currentNode.id,
              nodeName: currentNode.data?.name || 'Approval Checkpoint',
              nodeType: currentNode.type,
              actionTarget: currentNode.data?.actionTarget || 'Unknown Action',
              reason: result.output?.reason || 'Approval required to proceed.',
              payloadSnapshot: result.output?.payloadSnapshot || {},
              status: 'PENDING',
              requestedBy: 'system',
            },
          });

          // Break the linear loop because Temporal is orchestrating the pause.
          // Once Temporal receives the signal, it will resume by re-invoking activities.
          // For phase 4, since `execution.runner.ts` doesn't support resuming from middle naturally without Temporal,
          // we just exit here. The Temporal workflow will actually orchestrate the next steps.
          return;
        }

        await this.logger.logEvent(
          executionId,
          'NODE_COMPLETED',
          currentNode.id,
          { output: result.output },
          result.metrics,
        );
        inputs[currentNode.id] = result.output;

        // Record Billing Event if there's a cost
        const estimatedCost = result.metrics?.estimatedCost || 0;
        if (estimatedCost > 0) {
          const idempotencyKey = `usage-${executionId}-${currentNode.id}-${stepIndex}`;
          await this.billingLedger.recordEvent(
            workspaceId,
            BillingEventType.USAGE,
            estimatedCost,
            {
              executionId,
              nodeId: currentNode.id,
              nodeType: currentNode.type,
              metrics: result.metrics,
            },
            idempotencyKey,
          );
        }

        stepIndex++;

        // Find next node
        const outgoingEdges = edges.filter((e) => e.source === currentNode.id);
        if (outgoingEdges.length > 0) {
          // For simplicity in Phase 4, just take the first edge. Later Logic nodes will return nextNodeIds.
          const nextNodeId = result.nextNodeIds?.[0] || outgoingEdges[0].target;
          currentNode = nodes.find((n) => n.id === nextNodeId);
        } else {
          currentNode = undefined; // End of flow
        }
      }

      await this.stateManager.updateStatus(executionId, 'COMPLETED');
      await this.logger.logEvent(executionId, 'EXECUTION_COMPLETED');
    } catch (error: any) {
      await this.stateManager.updateStatus(executionId, 'FAILED');
      await this.logger.logEvent(executionId, 'EXECUTION_FAILED', undefined, {
        error: error.message,
      });
      console.error(`Execution ${executionId} failed:`, error.message);
    }
  }

  private getExecutor(type: string): NodeExecutor | undefined {
    switch (type) {
      case 'trigger':
        return this.triggerExecutor;
      case 'agent':
        return this.agentExecutor;
      case 'tool':
        return this.toolExecutor;
      case 'logic':
        return this.logicExecutor;
      case 'human-approval':
        return this.humanApprovalExecutor;
      default:
        return undefined;
    }
  }
}
