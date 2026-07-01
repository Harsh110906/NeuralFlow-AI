import React from 'react';
import { getFeatureFlags } from '@/lib/api/feature-flags';
import { FeatureFlagList } from '@/components/settings/feature-flag-list';
import { auth } from '@clerk/nextjs/server';

export default async function FeatureFlagsPage() {
  let flags: any[] = [];
  let error = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    flags = await getFeatureFlags(token);
  } catch (err: any) {
    error = err.message || 'Failed to load feature flags.';
  }

  return (
    <div className="p-8 text-zinc-900 dark:text-white max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Feature Flags</h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          Manage workspace-level feature exposure and beta access control.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Access Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <FeatureFlagList initialFlags={flags} />
      )}
    </div>
  );
}
