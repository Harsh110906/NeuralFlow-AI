export type AgentEvent =
  | 'AGENT_STARTED'
  | 'AGENT_COMPLETED'
  | 'AGENT_FAILED'
  | 'MESSAGE_PUBLISHED'
  | 'MESSAGE_RECEIVED'
  | 'HUMAN_APPROVED'
  | 'HUMAN_REJECTED'
  | 'WORKFLOW_PAUSED'
  | 'WORKFLOW_RESUMED'
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'SUPERVISOR_REVIEW_REQUESTED'
  | 'SUPERVISOR_APPROVED'
  | 'SUPERVISOR_REJECTED'
  | 'AGENT_FEEDBACK_PROVIDED';

export interface EventPayload {
  executionId: string;
  nodeId?: string;
  agentId?: string;
  data: any;
  timestamp: string;
}

export interface EventBusProvider {
  publish(event: AgentEvent, payload: EventPayload): Promise<void>;
  subscribe(
    event: AgentEvent,
    handler: (payload: EventPayload) => void,
  ): Promise<void>;
  unsubscribe(event: AgentEvent): Promise<void>;
}
