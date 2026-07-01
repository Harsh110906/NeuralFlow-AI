'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { createPortalSession, BillingSummaryDto } from '@/lib/api/billing';

export function SubscriptionCard({
  workspaceId,
  summary
}: {
  workspaceId: string;
  summary: BillingSummaryDto;
}) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageSubscription = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const { url } = await createPortalSession(workspaceId, token);
      window.location.assign(url);
    } catch (err: any) {
      setError(err.message || 'Failed to redirect to billing portal');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-gray-200 dark:border-gray-800 p-6 rounded-lg shadow-sm bg-white dark:bg-zinc-950">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1 text-gray-900 dark:text-white">Current Plan</h2>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{summary.planName}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          summary.subscriptionStatus === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
        }`}>
          {summary.subscriptionStatus.toUpperCase()}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Period: {new Date(summary.currentPeriodStart).toLocaleDateString()} - {new Date(summary.currentPeriodEnd).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Sync Status: {summary.syncStatus}
        </p>
      </div>

      {summary.canManageBilling ? (
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="w-full bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded font-medium hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Redirecting to Stripe...' : 'Manage Subscription'}
        </button>
      ) : (
        <p className="text-sm text-red-500 dark:text-red-400">You must be a Workspace Admin to manage billing.</p>
      )}
      
      {error && <p className="text-sm text-red-600 dark:text-red-400 mt-2">{error}</p>}
    </div>
  );
}
