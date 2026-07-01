const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export interface FeatureFlagDto {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  owner: string | null;
  type: string;
  expiresAt: string | null;
  createdAt: string;
  overrides: any[];
}

export async function getFeatureFlags(token: string | null): Promise<FeatureFlagDto[]> {
  const res = await fetch(`${API_BASE_URL}/feature-flags`, {
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store'
  });
  if (!res.ok) throw new Error('Failed to fetch feature flags');
  return res.json();
}

export async function updateFeatureFlag(id: string, data: { enabled?: boolean, owner?: string, expiresAt?: Date | null }, token: string | null) {
  const res = await fetch(`${API_BASE_URL}/feature-flags/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Failed to update feature flag');
  return res.json();
}
