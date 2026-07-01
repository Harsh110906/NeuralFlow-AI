'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createSecret } from '@/lib/api/secrets';

export function AddSecretModal({
  workspaceId,
  onClose,
  onSuccess
}: {
  workspaceId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { getToken } = useAuth();
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !value) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getToken();
      await createSecret(workspaceId, name, value, description || undefined, token);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to add secret');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
        <h2 className="text-xl font-bold mb-4">Add Workspace Secret</h2>
        {error && <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Key Name</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. OPENAI_API_KEY"
              className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none"
              required
            />
          </div>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Secret Value</label>
            <input 
              type="password" 
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="sk-..."
              className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Value will be encrypted via KMS and is never stored in plaintext.</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Description (Optional)</label>
            <input 
              type="text" 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Used for marketing agent"
              className="w-full border p-2 rounded focus:ring-1 focus:ring-black outline-none"
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
              className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Save Secret'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
