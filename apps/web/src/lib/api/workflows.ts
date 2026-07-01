export interface WorkflowDto {
  id: string;
  name: string;
  description: string;
  workspaceId: string;
  dagJson: any;
  updatedAt: string;
}

export interface CreateWorkflowDto {
  workspaceId: string;
  name: string;
  description?: string;
  templateId?: string;
}

export interface UpdateWorkflowDto {
  name?: string;
  description?: string;
  dagJson?: any;
}

export interface TemplateBetaConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  dagJson: any;
  requiredSecrets: string[];
  requiredConnectors: string[];
  suggestedInputs: Record<string, any>;
  previewMetadata: { image?: string; estimatedCost?: number };
  betaEnabled: boolean;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function getBetaTemplates(token: string | null): Promise<TemplateBetaConfig[]> {
  const res = await fetch(`${API_BASE_URL}/workflows/templates/beta`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch templates');
  return res.json();
}

export async function getWorkflows(workspaceId: string, token: string | null): Promise<WorkflowDto[]> {
  const res = await fetch(`${API_BASE_URL}/workflows?workspaceId=${workspaceId}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch workflows');
  return res.json();
}

export async function getWorkflow(id: string, token: string | null): Promise<WorkflowDto> {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to fetch workflow');
  return res.json();
}

export async function createWorkflow(dto: CreateWorkflowDto, token: string | null): Promise<WorkflowDto> {
  const res = await fetch(`${API_BASE_URL}/workflows`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to create workflow');
  return res.json();
}

export async function updateWorkflow(id: string, dto: UpdateWorkflowDto, token: string | null): Promise<WorkflowDto> {
  const res = await fetch(`${API_BASE_URL}/workflows/${id}`, {
    method: 'PUT',
    headers: { 
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}) 
    },
    body: JSON.stringify(dto),
  });
  if (!res.ok) throw new Error('Failed to update workflow');
  return res.json();
}
