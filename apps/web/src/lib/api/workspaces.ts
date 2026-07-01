const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getBootstrapWorkspaceId(token: string | null): Promise<string | null> {
  if (!token) return null;
  try {
    const res = await fetch(`${API_BASE_URL}/workspaces/bootstrap`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      console.error('Failed to fetch bootstrap workspace:', await res.text());
      return null;
    }
    const workspace = await res.json();
    return workspace?.id || null;
  } catch (error) {
    console.error('Error fetching bootstrap workspace:', error);
    return null;
  }
}
