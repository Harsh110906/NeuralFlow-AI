'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { rotateSecret } from '@/lib/api/secrets';

export function RotateSecretModal({
  workspaceId,
  secretName,
  onClose,
  onSuccess
}: {
  workspaceId: string;
  secretName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { getToken } = useAuth();
  const [newValue, setNewValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      await rotateSecret(workspaceId, secretName, newValue, token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to rotate secret');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-2">Rotate Secret</h2>
        <p className="text-sm text-gray-600 mb-4">
          Generating a new ciphertext and DEK for <span className="font-mono font-medium">{secretName}</span>. 
          The previous key will be archived securely.
        </p>

        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">New Secret Value</label>
            <input 
              type="password" 
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              placeholder="sk-..."
              className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none"
              required
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose}
              className="px-4 py-2 border rounded hover:bg-gray-50 transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Rotating...' : 'Rotate Secret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
