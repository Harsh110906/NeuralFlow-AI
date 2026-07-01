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
    <div className="border p-6 rounded-lg shadow-sm bg-white">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-semibold mb-1">Current Plan</h2>
          <p className="text-2xl font-bold">{summary.planName}</p>
        </div>
        <span className={`px-2 py-1 text-xs rounded-full font-medium ${
          summary.subscriptionStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {summary.subscriptionStatus.toUpperCase()}
        </span>
      </div>

      <div className="mb-6">
        <p className="text-sm text-gray-500">
          Period: {new Date(summary.currentPeriodStart).toLocaleDateString()} - {new Date(summary.currentPeriodEnd).toLocaleDateString()}
        </p>
        <p className="text-sm text-gray-500">
          Sync Status: {summary.syncStatus}
        </p>
      </div>

      {summary.canManageBilling ? (
        <button
          onClick={handleManageSubscription}
          disabled={loading}
          className="w-full bg-black text-white px-4 py-2 rounded hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Redirecting to Stripe...' : 'Manage Subscription'}
        </button>
      ) : (
        <p className="text-sm text-red-500">You must be a Workspace Admin to manage billing.</p>
      )}
      
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
