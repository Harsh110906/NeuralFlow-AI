import {
  proxyActivities,
  defineSignal,
  setHandler,
  condition,
} from '@temporalio/workflow';
import type * as activities from './activities';

const { executeNodeActivity } = proxyActivities<typeof activities>({
  startToCloseTimeout: '1 minute',
});

// Signals for Human-in-the-loop
export const approveSignal =
  defineSignal<[{ nodeId: string; userId: string }]>('approve');
export const rejectSignal =
  defineSignal<[{ nodeId: string; userId: string }]>('reject');

export async function executeWorkflowDAG(
  executionId: string,
  workflowId: string,
  dagJson: any,
): Promise<any> {
  const nodes = dagJson?.nodes || [];
  const edges = dagJson?.edges || [];

  let isApproved = false;
  let isRejected = false;
  let decisionUserId: string | null = null;

  setHandler(approveSignal, (payload: { nodeId: string; userId: string }) => {
    isApproved = true;
    decisionUserId = payload.userId;
  });

  setHandler(rejectSignal, (payload: { nodeId: string; userId: string }) => {
    isRejected = true;
    decisionUserId = payload.userId;
  });

  // Example simple sequential execution for now.
  // In a real DAG executor, we'd build a dependency graph and use Promise.all.
  for (const node of nodes) {
    if (node.type === 'human-approval') {
      // Execute the node to log the start state in NestJS (via activities)
      await executeNodeActivity(executionId, node.id, node);

      // Pause and wait for HITL signal
      isApproved = false;
      isRejected = false;
      decisionUserId = null;
      await condition(() => isApproved || isRejected);

      if (isRejected) {
        return {
          status: 'FAILED',
          reason: `Human Rejected by ${decisionUserId}`,
        };
      }
    } else {
      // Execute regular node
      await executeNodeActivity(executionId, node.id, node);
    }
  }

  return { status: 'COMPLETED' };
}
