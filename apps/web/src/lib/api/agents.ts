const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface Agent {
  id: string;
  workspaceId: string;
  name: string;
  systemPrompt: string;
  model: string;
  tools: string[];
  temperature?: number;
  versions?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentRelease {
  id: string;
  agentId: string;
  versionId: string;
  environment: string;
  promotedBy: string;
  createdAt: string;
  version?: any;
}

export async function getAgents(workspaceId: string, token: string | null): Promise<Agent[]> {
  const res = await fetch(`${API_BASE}/agents?workspaceId=${workspaceId}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch agents');
  return res.json();
}

export async function getAgent(id: string, token: string | null): Promise<Agent> {
  const res = await fetch(`${API_BASE}/agents/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch agent');
  return res.json();
}

export async function createAgent(workspaceId: string, data: Partial<Agent>, token: string | null): Promise<Agent> {
  const res = await fetch(`${API_BASE}/agents`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ workspaceId, ...data })
  });
  if (!res.ok) throw new Error('Failed to create agent');
  return res.json();
}

export async function updateAgent(id: string, data: Partial<Agent>, token: string | null): Promise<Agent> {
  const res = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update agent');
  return res.json();
}

export async function deleteAgent(id: string, token: string | null): Promise<void> {
  const res = await fetch(`${API_BASE}/agents/${id}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  if (!res.ok) throw new Error('Failed to delete agent');
}

export async function chatWithAgent(id: string, message: string, token: string | null): Promise<any> {
  const res = await fetch(`${API_BASE}/agents/${id}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ message })
  });
  if (!res.ok) throw new Error('Failed to chat with agent');
  return res.json();
}

export async function getAgentReleases(id: string, token: string | null): Promise<AgentRelease[]> {
  const res = await fetch(`${API_BASE}/agents/${id}/releases`, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch agent releases');
  return res.json();
}

export async function promoteAgentVersion(id: string, versionId: string, environment: string, bypassEvaluationCheck: boolean, token: string | null): Promise<AgentRelease> {
  const res = await fetch(`${API_BASE}/agents/${id}/releases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ versionId, environment, bypassEvaluationCheck })
  });
  if (!res.ok) throw new Error('Failed to promote agent version');
  return res.json();
}

export async function rollbackAgentVersion(id: string, versionId: string, environment: string, token: string | null): Promise<AgentRelease> {
  const res = await fetch(`${API_BASE}/agents/${id}/releases/rollback`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ versionId, environment })
  });
  if (!res.ok) throw new Error('Failed to rollback agent version');
  return res.json();
}
