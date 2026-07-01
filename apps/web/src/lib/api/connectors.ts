const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface ConnectorDto {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  authType: string;
  manifest: any;
  status: string;
  version: number;
  createdAt: string;
}

export async function getConnectors(workspaceId: string, token: string | null): Promise<ConnectorDto[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch connectors');
  return res.json();
}

export async function getConnector(workspaceId: string, id: string, token: string | null): Promise<ConnectorDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors/${id}`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch connector');
  return res.json();
}

export async function createConnector(workspaceId: string, data: any, token: string | null): Promise<ConnectorDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to create connector');
  return res.json();
}

export async function updateConnector(workspaceId: string, id: string, data: any, token: string | null): Promise<ConnectorDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update connector');
  return res.json();
}

export async function publishConnector(workspaceId: string, id: string, token: string | null): Promise<ConnectorDto> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors/${id}/publish`, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  });
  if (!res.ok) throw new Error('Failed to publish connector');
  return res.json();
}

export async function setConnectorSecret(workspaceId: string, id: string, keyName: string, value: string, token: string | null): Promise<{ success: boolean }> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors/${id}/secrets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ keyName, value })
  });
  if (!res.ok) throw new Error('Failed to save secret');
  return res.json();
}

export async function testSandbox(workspaceId: string, id: string, sandboxConfig: any, token: string | null): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/connectors/${id}/sandbox`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(sandboxConfig)
  });
  if (!res.ok) throw new Error('Sandbox request failed');
  return res.json();
}
