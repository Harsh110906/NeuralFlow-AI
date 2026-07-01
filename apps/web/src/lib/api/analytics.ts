export interface WorkspaceMetrics {
  executionMetrics: {
    totalExecutions: number;
    successRate: number;
    failureRate: number;
    averageRuntime: number;
    inProgressCount: number;
    failedCount: number;
    failureCategories: Record<string, number>;
  };
  aiMetrics: {
    totalTokens: number;
    totalCost: number;
  };
  systemMetrics: {
    // any system metrics needed by other components, though not used in metrics-grid
  };
}

export interface ExecutionSummary {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  durationMs: number;
  tokenUsage: number;
}

export interface ExecutionEvent {
  id: string;
  timestamp: string;
  eventType: 'workflow_start' | 'node_start' | 'node_complete' | 'node_failed' | 'workflow_complete' | 'workflow_failed';
  nodeId?: string;
  nodeType?: string;
  agentId?: string;
  promptTokens?: number;
  completionTokens?: number;
  error?: string;
  data?: any;
  model?: string;
}

export interface ExecutionDetail {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: 'success' | 'failed' | 'running';
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  totalCostUsd: number;
  events: ExecutionEvent[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getWorkspaceMetrics(workspaceId: string, token: string | null): Promise<WorkspaceMetrics> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/analytics/metrics`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch metrics');
  return res.json();
}

export async function getRecentExecutions(workspaceId: string, token: string | null): Promise<ExecutionSummary[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/analytics/executions`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch executions');
  return res.json();
}

export async function getExecutionDetail(workspaceId: string, executionId: string, token: string | null): Promise<ExecutionDetail> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/analytics/executions/${executionId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch execution detail');
  return res.json();
}
