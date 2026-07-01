'use client';

import React, { useState } from 'react';
import { updateFeatureFlag, FeatureFlagDto } from '@/lib/api/feature-flags';
import { useAuth } from '@clerk/nextjs';
import { Loader2, ShieldAlert } from 'lucide-react';

export function FeatureFlagList({ initialFlags }: { initialFlags: FeatureFlagDto[] }) {
  const [flags, setFlags] = useState<FeatureFlagDto[]>(initialFlags);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    setLoadingId(id);
    try {
      const token = await getToken();
      await updateFeatureFlag(id, { enabled: !currentEnabled }, token);
      setFlags(flags.map(f => f.id === id ? { ...f, enabled: !currentEnabled } : f));
    } catch (err) {
      console.error(err);
      alert('Failed to update feature flag');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-200 dark:border-zinc-800">
            <th className="py-4 px-6 font-semibold text-sm">Feature Name</th>
            <th className="py-4 px-6 font-semibold text-sm">Key</th>
            <th className="py-4 px-6 font-semibold text-sm">Owner</th>
            <th className="py-4 px-6 font-semibold text-sm text-right">Status</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.id} className="border-b border-zinc-100 dark:border-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
              <td className="py-4 px-6">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{flag.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    flag.type === 'RELEASE' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                    flag.type === 'EXPERIMENT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                    'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}>
                    {flag.type}
                  </span>
                </div>
              </td>
              <td className="py-4 px-6 font-mono text-sm text-zinc-500">{flag.key}</td>
              <td className="py-4 px-6 text-sm text-zinc-500">{flag.owner || 'system'}</td>
              <td className="py-4 px-6 text-right">
                <button
                  onClick={() => handleToggle(flag.id, flag.enabled)}
                  disabled={loadingId === flag.id}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    flag.enabled ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      flag.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                  {loadingId === flag.id && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
                    </span>
                  )}
                </button>
              </td>
            </tr>
          ))}
          {flags.length === 0 && (
            <tr>
              <td colSpan={4} className="py-12 text-center text-zinc-500 flex flex-col items-center justify-center">
                <ShieldAlert className="w-12 h-12 text-zinc-300 mb-2" />
                <p>No feature flags found.</p>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
