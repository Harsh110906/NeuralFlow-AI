'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { SecretMetadataDto } from '@/lib/api/secrets';
import { SecretList } from './secret-list';
import { AddSecretModal } from './add-secret-modal';

export function SecretsPageClient({ 
  workspaceId, 
  initialSecrets 
}: { 
  workspaceId: string; 
  initialSecrets: SecretMetadataDto[];
}) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return (
    <>
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Active Secrets</h2>
          <button 
            onClick={() => setIsAdding(true)}
            className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors shadow-sm font-medium"
          >
            + New Secret
          </button>
        </div>
        
        <SecretList 
          workspaceId={workspaceId}
          secrets={initialSecrets}
          onRefresh={handleRefresh}
        />
      </div>

      {isAdding && (
        <AddSecretModal 
          workspaceId={workspaceId}
          onClose={() => setIsAdding(false)}
          onSuccess={() => {
            setIsAdding(false);
            handleRefresh();
          }}
        />
      )}
    </>
  );
}
