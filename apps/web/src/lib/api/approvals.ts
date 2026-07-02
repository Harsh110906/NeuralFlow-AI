const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface ApprovalRequestDto {
  id: string;
  workspaceId: string;
  executionId: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  actionTarget: string;
  reason: string;
  executionSummary?: string;
  payloadSnapshot: any;
  decisionReason?: string;
  status: string;
  requestedBy: string;
  approvedBy?: string;
  approvedAt?: string;
  expiresAt?: string;
  createdAt: string;
}

export async function getPendingApprovals(workspaceId: string, token: string | null): Promise<ApprovalRequestDto[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/approvals/pending`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch pending approvals');
  return res.json();
}

export async function getApprovalHistory(workspaceId: string, token: string | null): Promise<ApprovalRequestDto[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/approvals/history`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch approval history');
  return res.json();
}

export async function getApproval(workspaceId: string, id: string, token: string | null): Promise<ApprovalRequestDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/approvals/${id}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch approval');
  return res.json();
}

export async function submitDecision(
  workspaceId: string, 
  id: string, 
  decision: 'APPROVED' | 'REJECTED', 
  reason: string, 
  token: string | null
): Promise<ApprovalRequestDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/approvals/${id}/decision`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ decision, reason })
  });
  
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to submit decision');
  }
  return res.json();
}

export async function cancelApproval(workspaceId: string, id: string, token: string | null): Promise<ApprovalRequestDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/approvals/${id}/cancel`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (!res.ok) throw new Error('Failed to cancel approval');
  return res.json();
}
