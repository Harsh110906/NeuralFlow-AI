import React from 'react';
import { getBillingSummary, getLedgerHistory } from '@/lib/api/billing';
import { SubscriptionCard } from '@/components/billing/subscription-card';
import { UsageDashboardClient } from '@/components/billing/usage-dashboard-client';
import { auth } from '@clerk/nextjs/server';

import { getBootstrapWorkspaceId } from '@/lib/api/workspaces';

export default async function BillingDashboard() {
  let summary = null;
  let ledger: any[] = [];
  let error = null;
  let currentWorkspaceId = '';

  try {
    const { getToken } = await auth();
    const token = await getToken();
    const workspaceId = await getBootstrapWorkspaceId(token);
    
    if (!workspaceId) {
      error = 'Please select a workspace to view billing.';
    } else {
      currentWorkspaceId = workspaceId;
      summary = await getBillingSummary(workspaceId, token);
      ledger = await getLedgerHistory(workspaceId, token);
    }
  } catch (err: any) {
    error = err.message || 'Failed to load billing summary.';
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Billing & Usage Dashboard</h1>
      <p className="text-gray-600 mb-8">
        Manage your Stripe subscription, view token consumption, and monitor API metering.
      </p>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Access Error</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : summary ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <SubscriptionCard workspaceId={currentWorkspaceId} summary={summary} />
          
          <div className="border border-gray-200 dark:border-gray-800 p-6 rounded-lg shadow-sm bg-white dark:bg-zinc-950">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Internal Ledger Usage</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Synchronized via Meter Events</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {summary.rawTokenUsage.toLocaleString()} <span className="text-base font-normal text-gray-500 dark:text-gray-400">Tokens</span>
            </p>
          </div>

          <div className="border border-gray-200 dark:border-gray-800 p-6 rounded-lg shadow-sm bg-white dark:bg-zinc-950">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Estimated Costs</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Stripe Financial Truth</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              ${(summary.meteredUsageCostCents / 100).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 border-t border-gray-200 dark:border-gray-800 pt-2">
              Upcoming Invoice Total: ${(summary.upcomingInvoiceTotalCents / 100).toFixed(2)}
            </p>
          </div>
          
          <UsageDashboardClient workspaceId={currentWorkspaceId} summary={summary} />

          <div className="md:col-span-3 border border-gray-200 dark:border-gray-800 p-6 rounded-lg shadow-sm bg-white dark:bg-zinc-950 mt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Billing Ledger History</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800">
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Date</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Type</th>
                    <th className="py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length > 0 ? (
                    ledger.map((entry: any) => (
                      <tr key={entry.id} className="border-b border-gray-100 dark:border-gray-800/50 hover:bg-gray-50 dark:hover:bg-zinc-900">
                        <td className="py-3 px-4 text-sm font-mono text-gray-600 dark:text-gray-400">
                          {new Date(entry.createdAt).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-xs px-2 py-1 rounded font-medium ${
                            entry.type === 'USAGE' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
                            entry.type === 'SUBSCRIPTION' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300' :
                            'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                          }`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-sm font-bold ${entry.amountUsd < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          ${entry.amountUsd.toFixed(4)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                        No ledger history found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
         <p>Loading...</p>
      )}
    </div>
  );
}
