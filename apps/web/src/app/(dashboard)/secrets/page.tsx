import React from 'react';
import { listSecrets } from '@/lib/api/secrets';
import { SecretsPageClient } from '@/components/secrets/secrets-page-client';
import { auth } from '@clerk/nextjs/server';

// Note: In real app, workspaceId would come from URL or Context.
const currentWorkspaceId = 'dummy-workspace-id';

export default async function SecretsDashboard() {
  let secrets: any[] = [];
  let error = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    secrets = await listSecrets(currentWorkspaceId, token);
  } catch (err: any) {
    error = err.message || 'Failed to load secrets.';
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Secret Manager</h1>
      <p className="text-gray-600 mb-8">
        Securely manage API keys and credentials. Data is protected by AES-256-GCM envelope encryption. Decrypted values never leave the secure execution environment.
      </p>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Access Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <SecretsPageClient workspaceId={currentWorkspaceId} initialSecrets={secrets} />
      )}
    </div>
  );
}
