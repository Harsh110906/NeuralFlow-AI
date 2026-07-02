const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function chatWithCopilotStream(message: string, history: any[], token: string | null) {
  const res = await fetch(`${API_BASE_URL}/copilot/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ message, history }),
  });

  if (!res.ok) {
    throw new Error('Failed to connect to Copilot chat stream.');
  }

  return res.body;
}

export async function generateWorkflowFromText(prompt: string, workspaceId: string, token: string | null, currentDagJson: any = null) {
  const res = await fetch(`${API_BASE_URL}/copilot/generate-workflow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({ prompt, workspaceId, currentDagJson }),
  });

  if (!res.ok) {
    throw new Error('Failed to generate workflow from text.');
  }

  return res.json();
}
