'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getUsageChart, updateBillingPolicy, BillingSummaryDto } from '@/lib/api/billing';

export function UsageDashboardClient({ workspaceId, summary }: { workspaceId: string, summary: BillingSummaryDto }) {
  const { getToken } = useAuth();
  const [usageData, setUsageData] = useState<{date: string, amountUsd: number}[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Budget Form State
  const [monthlyBudget, setMonthlyBudget] = useState<number>(100);
  const [softWarningThreshold, setSoftWarningThreshold] = useState<number>(0.8);
  const [hardCutoff, setHardCutoff] = useState<boolean>(true);
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const token = await getToken();
        const data = await getUsageChart(workspaceId, token);
        setUsageData(data.data);
      } catch (err) {
        console.error('Failed to load usage chart:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceId, getToken]);

  const handleSavePolicy = async () => {
    setSavingPolicy(true);
    try {
      const token = await getToken();
      await updateBillingPolicy(workspaceId, {
        monthlyBudget,
        softWarningThreshold,
        hardCutoff
      }, token);
      alert('Billing policy updated successfully.');
    } catch (err) {
      alert('Failed to update billing policy.');
    } finally {
      setSavingPolicy(false);
    }
  };

  const currentSpendUsd = summary.meteredUsageCostCents / 100;
  const isBlocked = hardCutoff && currentSpendUsd >= monthlyBudget;
  const isWarning = currentSpendUsd >= (monthlyBudget * softWarningThreshold);
  
  let statusColor = 'bg-green-100 text-green-800';
  let statusText = 'ACTIVE';
  
  if (isBlocked) {
    statusColor = 'bg-red-100 text-red-800';
    statusText = 'BLOCKED (Limit Reached)';
  } else if (isWarning) {
    statusColor = 'bg-yellow-100 text-yellow-800';
    statusText = 'WARNING (Nearing Limit)';
  }

  // Very basic inline SVG chart since we don't have a charting library guaranteed installed
  const maxAmount = Math.max(...usageData.map(d => d.amountUsd), 1);
  const chartHeight = 150;

  return (
    <div className="space-y-6 mt-6 col-span-1 md:col-span-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Usage & Budget Overview */}
        <div className="border p-6 rounded-lg shadow-sm bg-white flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-semibold">Current Usage vs Budget</h2>
            <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColor}`}>
              {statusText}
            </span>
          </div>
          
          <div className="mt-4 flex-1">
            <div className="flex justify-between text-sm mb-1">
              <span>Spend: ${currentSpendUsd.toFixed(2)}</span>
              <span className="text-gray-500">Budget: ${monthlyBudget.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 relative">
              {/* Soft limit marker */}
              <div 
                className="absolute top-0 bottom-0 w-1 bg-yellow-400 z-10" 
                style={{ left: `${softWarningThreshold * 100}%` }}
                title={`Warning Threshold: $${(monthlyBudget * softWarningThreshold).toFixed(2)}`}
              ></div>
              <div 
                className={`h-4 rounded-full ${isBlocked ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-black'}`}
                style={{ width: `${Math.min((currentSpendUsd / monthlyBudget) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          
          {loading ? (
             <div className="mt-8 text-sm text-gray-500 text-center">Loading chart...</div>
          ) : usageData.length > 0 ? (
            <div className="mt-8 h-32 flex items-end space-x-2">
              {usageData.map((d, i) => {
                const height = (d.amountUsd / maxAmount) * chartHeight;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center group relative">
                    <div 
                      className="w-full bg-blue-100 group-hover:bg-blue-300 rounded-t transition-colors"
                      style={{ height: `${height}px`, minHeight: '4px' }}
                    ></div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-1 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20">
                      {d.date}: ${d.amountUsd.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
             <div className="mt-8 text-sm text-gray-500 text-center h-32 flex items-center justify-center">No usage data this month.</div>
          )}
        </div>

        {/* Policy Configuration */}
        <div className="border p-6 rounded-lg shadow-sm bg-white">
          <h2 className="text-xl font-semibold mb-4">Billing Guardrails</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget ($)</label>
              <input 
                type="number" 
                value={monthlyBudget}
                onChange={e => setMonthlyBudget(Number(e.target.value))}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                min="0"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Soft Warning Threshold (%)</label>
              <input 
                type="number" 
                value={Math.round(softWarningThreshold * 100)}
                onChange={e => setSoftWarningThreshold(Number(e.target.value) / 100)}
                className="w-full border-gray-300 rounded-md shadow-sm p-2 border"
                min="1" max="100"
              />
              <p className="text-xs text-gray-500 mt-1">Alerts when spend reaches {Math.round(softWarningThreshold * 100)}% of the monthly budget.</p>
            </div>
            
            <div className="flex items-center">
              <input 
                type="checkbox" 
                id="hardCutoff"
                checked={hardCutoff}
                onChange={e => setHardCutoff(e.target.checked)}
                className="h-4 w-4 text-black border-gray-300 rounded"
              />
              <label htmlFor="hardCutoff" className="ml-2 block text-sm text-gray-900">
                Enable Hard Cutoff
              </label>
            </div>
            <p className="text-xs text-gray-500 pl-6">If enabled, workflows will be blocked from executing when the budget is reached.</p>
            
            <div className="pt-4">
              <button
                onClick={handleSavePolicy}
                disabled={savingPolicy}
                className="bg-black text-white px-4 py-2 rounded font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {savingPolicy ? 'Saving...' : 'Save Policy'}
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
