const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface DiagnosticIssue {
  severity: 'ERROR' | 'WARNING' | 'INFO';
  nodeId?: string;
  message: string;
  fixHint?: string;
}

export async function runWorkflowDoctor(workflowId: string, workspaceId: string, dagJson: any, token: string | null): Promise<DiagnosticIssue[]> {
  const res = await fetch(`${API_BASE_URL}/workflows/${workflowId}/doctor?workspaceId=${workspaceId}`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ dagJson }),
  });
  
  if (!res.ok) {
    throw new Error('Failed to run workflow doctor diagnostics.');
  }
  
  return res.json();
}
