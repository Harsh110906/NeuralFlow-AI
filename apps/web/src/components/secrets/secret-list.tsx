'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import type { SecretMetadataDto } from '@/lib/api/secrets';
import { deleteSecret } from '@/lib/api/secrets';
import { RotateSecretModal } from './rotate-secret-modal';

interface SecretListProps {
  workspaceId: string;
  secrets: SecretMetadataDto[];
  onRefresh: () => void;
}

export function SecretList({
  workspaceId,
  secrets,
  onRefresh
}: SecretListProps) {
  const { getToken } = useAuth();
  const [deleteStatus, setDeleteStatus] = useState<{[key: string]: 'idle' | 'deleting' | 'error'}>({});
  const [rotatingSecret, setRotatingSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (name: string) => {
    if (!window.confirm(`Are you sure you want to revoke ${name}? This action cannot be undone.`)) {
      return;
    }
    
    setDeleteStatus(prev => ({ ...prev, [name]: 'deleting' }));
    setError(null);
    try {
      const token = await getToken();
      await deleteSecret(workspaceId, name, token);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete secret');
      setDeleteStatus(prev => ({ ...prev, [name]: 'error' }));
    } finally {
      setDeleteStatus(prev => ({ ...prev, [name]: 'idle' }));
    }
  };

  if (secrets.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 border rounded">
        No secrets found for this workspace.
      </div>
    );
  }

  return (
    <>
      {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
      <div className="border rounded divide-y">
        {secrets.map((secret) => (
          <div key={secret.name} className="p-4 flex flex-col md:flex-row justify-between md:items-center">
            <div>
              <p className="font-medium">{secret.name}</p>
              {secret.description && <p className="text-sm text-gray-600 mt-1">{secret.description}</p>}
              <div className="flex space-x-4 mt-2 text-xs text-gray-500">
                <p>Created: {new Date(secret.createdAt).toLocaleDateString()}</p>
                {secret.lastRotatedAt && <p>Rotated: {new Date(secret.lastRotatedAt).toLocaleDateString()}</p>}
                <p>In Use: {secret.inUseByConnectors} connections</p>
              </div>
            </div>
            <div className="flex space-x-3 mt-4 md:mt-0">
              <button 
                onClick={() => setRotatingSecret(secret.name)}
                className="text-blue-600 text-sm hover:underline font-medium"
              >
                Rotate
              </button>
              <button 
                onClick={() => handleDelete(secret.name)}
                disabled={deleteStatus[secret.name] === 'deleting'}
                className="text-red-600 text-sm hover:underline font-medium disabled:opacity-50"
              >
                {deleteStatus[secret.name] === 'deleting' ? 'Revoking...' : 'Revoke'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {rotatingSecret && (
        <RotateSecretModal 
          workspaceId={workspaceId} 
          secretName={rotatingSecret} 
          onClose={() => setRotatingSecret(null)}
          onSuccess={() => {
            setRotatingSecret(null);
            onRefresh();
          }} 
        />
      )}
    </>
  );
}
