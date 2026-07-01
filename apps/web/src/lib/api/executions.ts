export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface Execution {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'AWAITING_APPROVAL';
  createdAt: string;
  updatedAt: string;
  workflow?: {
    id: string;
    name: string;
    workspaceId: string;
  };
  events?: ExecutionEvent[];
}

export interface ExecutionEvent {
  id: string;
  executionId: string;
  type: string;
  nodeId?: string;
  data?: any;
  createdAt: string;
}

export async function getExecution(executionId: string, token: string | null): Promise<Execution> {
  const res = await fetch(`${API_BASE_URL}/executions/${executionId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch execution');
  return res.json();
}

export async function getPendingApprovals(workspaceId: string, token: string | null): Promise<Execution[]> {
  const res = await fetch(`${API_BASE_URL}/executions/pending-approvals?workspaceId=${workspaceId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch pending approvals');
  return res.json();
}

export async function approveNode(executionId: string, nodeId: string, userId: string, token: string | null) {
  const res = await fetch(`${API_BASE_URL}/executions/${executionId}/approve/${nodeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Forbidden: You must be a Workspace Admin to approve.');
    throw new Error('Failed to approve node');
  }
  return res.json();
}

export async function rejectNode(executionId: string, nodeId: string, userId: string, token: string | null) {
  const res = await fetch(`${API_BASE_URL}/executions/${executionId}/reject/${nodeId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ userId })
  });
  if (!res.ok) {
    if (res.status === 403) throw new Error('Forbidden: You must be a Workspace Admin to reject.');
    throw new Error('Failed to reject node');
  }
  return res.json();
}
