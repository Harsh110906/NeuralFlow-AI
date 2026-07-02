export interface SecretMetadataDto {
  name: string;
  createdAt: string;
  lastRotatedAt: string | null;
  description?: string;
  inUseByConnectors: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function listSecrets(workspaceId: string, token: string | null): Promise<SecretMetadataDto[]> {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/secrets`, {
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    cache: 'no-store', 
  });

  if (!res.ok) {
    throw new Error('Failed to fetch secrets');
  }

  return res.json();
}

export async function createSecret(workspaceId: string, name: string, value: string, description: string | undefined, token: string | null) {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/secrets`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ name, value, description }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to create secret');
  }

  return res.json();
}

export async function rotateSecret(workspaceId: string, name: string, newValue: string, token: string | null) {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/secrets/${name}/rotate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ newValue }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to rotate secret');
  }

  return res.json();
}

export async function deleteSecret(workspaceId: string, name: string, token: string | null) {
  const res = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/secrets/${name}`, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || 'Failed to delete secret');
  }

  return res.json();
}
