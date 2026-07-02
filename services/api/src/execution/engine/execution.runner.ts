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

      // 1. Cycle Detection & Structural Validation
      this.validateDAG(nodes, edges);

      const triggerNodes = nodes.filter((n) => n.type === 'trigger');
      if (triggerNodes.length === 0) {
        throw new Error('Graph must contain at least one trigger node.');
      }

      const workflow = await this.prisma.workflow.findUnique({
        where: { id: workflowId },
      });
      if (!workflow) throw new Error(`Workflow ${workflowId} not found`);
      const workspaceId = workflow.workspaceId;

      const inputs: Record<string, any> = {};
      const nodeStatus = new Map<string, 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'SKIPPED'>();
      const nodeRetries = new Map<string, number>();
      
      nodes.forEach(n => nodeStatus.set(n.id, 'PENDING'));

      // Topological Execution State
      let hasRunningNodes = false;

      // Evaluate node readiness based on topological dependencies
      const evaluateReadiness = () => {
        const readyNodes: any[] = [];
        for (const node of nodes) {
          if (nodeStatus.get(node.id) !== 'PENDING') continue;

          const incomingEdges = edges.filter(e => e.target === node.id);
          
          if (incomingEdges.length === 0) {
            // No dependencies, ready to run (usually trigger nodes)
            readyNodes.push(node);
          } else {
            // Check if ALL dependencies have resolved
            let allResolved = true;
            let anySkipped = false;

            for (const edge of incomingEdges) {
              const sourceStatus = nodeStatus.get(edge.source);
              if (sourceStatus === 'PENDING' || sourceStatus === 'RUNNING') {
                allResolved = false;
                break;
              }
              if (sourceStatus === 'SKIPPED' || sourceStatus === 'FAILED') {
                anySkipped = true; // If a dependency failed or skipped, we might need to skip this
              }
            }

            if (allResolved) {
              if (anySkipped) {
                // If dependencies were skipped, we skip this node too
                nodeStatus.set(node.id, 'SKIPPED');
                this.logger.logEvent(executionId, 'NODE_SKIPPED', node.id);
                // Trigger re-evaluation since a state changed
                return evaluateReadiness();
              } else {
                readyNodes.push(node);
              }
            }
          }
        }
        return readyNodes;
      };

      let stepIndex = 0;

      // Future-ready execution loop: evaluates readiness and processes sequentially
      // but structured to allow Promise.all() parallel execution easily.
      while (true) {
        const readyNodes = evaluateReadiness();
        
        if (readyNodes.length === 0) {
          if (Array.from(nodeStatus.values()).some(s => s === 'RUNNING')) {
            // Wait for running nodes to finish (in full parallel mode)
            // For now, we don't have true parallel async tasks in this loop
            break; 
          }
          break; // Nothing more to run
        }

        // Pop the first ready node
        const currentNode = readyNodes[0];
        nodeStatus.set(currentNode.id, 'RUNNING');

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

        let retryCount = 0;
        const maxRetries = currentNode.data.config?.retryCount || 1; // Default to 1 attempt (0 retries)
        let success = false;
        let result: any;

        while (retryCount < maxRetries && !success) {
          try {
            result = await executor.execute(context);
            if (result.status === 'FAILED') {
              throw new Error(result.error);
            }
            success = true;
          } catch (e: any) {
            retryCount++;
            if (retryCount >= maxRetries) {
              await this.logger.logEvent(
                executionId,
                'NODE_FAILED',
                currentNode.id,
                { error: e.message || String(e) },
              );
              nodeStatus.set(currentNode.id, 'FAILED');
              
              // Handle Failure Policy
              const failurePolicy = currentNode.data.config?.failurePolicy || 'STOP';
              if (failurePolicy === 'STOP') {
                throw new Error(`Node ${currentNode.id} failed after ${retryCount} attempts: ${e.message}`);
              }
            } else {
              // Simple backoff
              await new Promise(res => setTimeout(res, 1000 * retryCount));
            }
          }
        }

        if (!success) {
          // If failure policy wasn't STOP, we just marked it FAILED. Downstream will skip.
          continue;
        }

        // Handle PAUSED / Human Approval
        if (result.status === 'PAUSED') {
          await this.logger.logEvent(
            executionId,
            'NODE_PAUSED',
            currentNode.id,
            { output: result.output },
          );
          await this.stateManager.updateStatus(executionId, 'AWAITING_APPROVAL');

          await this.prisma.approvalRequest.create({
            data: {
              workspaceId,
              executionId,
              nodeId: currentNode.id,
              nodeName: currentNode.data?.label || 'Approval Checkpoint',
              nodeType: currentNode.type,
              actionTarget: currentNode.data?.actionTarget || 'Unknown Action',
              reason: result.output?.reason || 'Approval required to proceed.',
              payloadSnapshot: result.output?.payloadSnapshot || {},
              status: 'PENDING',
              requestedBy: 'system',
            },
          });
          return; // Exit execution orchestration; Temporal will resume later
        }

        nodeStatus.set(currentNode.id, 'COMPLETED');
        await this.logger.logEvent(
          executionId,
          'NODE_COMPLETED',
          currentNode.id,
          { output: result.output },
          result.metrics,
        );
        inputs[currentNode.id] = result.output;

        // Determine which branches to skip (Runtime Branch Semantics)
        if (result.nextNodeIds) {
          const outgoingEdges = edges.filter(e => e.source === currentNode.id);
          for (const edge of outgoingEdges) {
            if (!result.nextNodeIds.includes(edge.target)) {
              nodeStatus.set(edge.target, 'SKIPPED');
              this.logger.logEvent(executionId, 'NODE_SKIPPED', edge.target, { reason: 'Branch not selected by logic node' });
            }
          }
        }

        // Record Billing
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

  private validateDAG(nodes: any[], edges: any[]) {
    const adj = new Map<string, string[]>();
    nodes.forEach(n => adj.set(n.id, []));
    edges.forEach(e => {
      if (adj.has(e.source)) {
        adj.get(e.source)!.push(e.target);
      }
    });

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const detectCycle = (nodeId: string): boolean => {
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        recStack.add(nodeId);

        const neighbors = adj.get(nodeId) || [];
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor) && detectCycle(neighbor)) return true;
          else if (recStack.has(neighbor)) return true;
        }
      }
      recStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (detectCycle(node.id)) {
        throw new Error('Cycle detected in workflow graph. Execution aborted.');
      }
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
