const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface TemplateVersion {
  id: string;
  version: number;
  dagJson: any;
  agentJson: any;
  requiredConnectors: string[];
  requiredSecrets: string[];
  createdAt: string;
}

export interface Template {
  id: string;
  name: string;
  description?: string;
  category: string;
  type: string;
  visibility: string;
  isGlobal?: boolean;
  activeVersionId?: string;
  createdAt: string;
  versions: TemplateVersion[];
}

export async function getTemplates(token: string | null, workspaceId?: string, isPublic?: boolean): Promise<Template[]> {
  const url = new URL(`${API_BASE_URL}/templates`);
  if (workspaceId) url.searchParams.append('workspaceId', workspaceId);
  if (isPublic !== undefined) url.searchParams.append('isPublic', String(isPublic));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch templates');
  return response.json();
}

export async function getTemplateDetails(id: string, token: string | null, version?: number): Promise<Template> {
  const url = new URL(`${API_BASE_URL}/templates/${id}`);
  if (version !== undefined) url.searchParams.append('version', String(version));

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) throw new Error('Failed to fetch template details');
  return response.json();
}

export async function publishTemplate(data: {
  name: string;
  description?: string;
  category: string;
  type: string;
  dagJson?: any;
  agentJson?: any;
  requiredConnectors?: string[];
  requiredSecrets?: string[];
}, token: string | null, workspaceId?: string) {
  
  const payload = workspaceId ? { ...data, workspaceId } : data;

  const response = await fetch(`${API_BASE_URL}/templates`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to publish template');
  return response.json();
}

export async function seedSystemTemplates(token: string | null) {
  
  const response = await fetch(`${API_BASE_URL}/templates/seed`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) throw new Error('Failed to seed system templates');
  return response.json();
}

export async function installTemplate(templateId: string, workspaceId: string, token: string | null, versionId?: string) {
  const payload: any = { workspaceId };
  if (versionId) payload.versionId = versionId;

  const response = await fetch(`${API_BASE_URL}/templates/${templateId}/install`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error('Failed to install template');
  return response.json();
}
