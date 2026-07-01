import { Injectable } from '@nestjs/common';
import {
  NodeExecutor,
  NodeExecutorContext,
  NodeExecutionResult,
} from '../interfaces/node.executor';

@Injectable()
export class HumanApprovalNodeExecutor implements NodeExecutor {
  async execute(context: NodeExecutorContext): Promise<NodeExecutionResult> {
    try {
      // Return a special status to signal to the runner to pause.
      // The runner will log the event and change execution status to AWAITING_APPROVAL.
      return {
        status: 'PAUSED',
        output: {
          nodeId: context.nodeId,
          reason: context.nodeData.reason || 'Approval required to proceed.',
          payloadSnapshot: context.inputs,
        },
      };
    } catch (err: any) {
      return {
        status: 'FAILED',
        error:
          err.message || 'Unknown error during Human Approval node execution',
      };
    }
  }
}
