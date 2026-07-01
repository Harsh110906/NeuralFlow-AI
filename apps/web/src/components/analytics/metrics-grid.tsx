'use client';

import React from 'react';
import { WorkspaceMetrics } from '@/lib/api/analytics';

export function MetricsGrid({ metrics }: { metrics: WorkspaceMetrics }) {
  const { executionMetrics, aiMetrics, systemMetrics } = metrics;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Executions */}
      <div className="bg-white rounded-lg p-5 shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Total Executions</h3>
        <p className="text-3xl font-bold">{executionMetrics.totalExecutions}</p>
        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1">
            <span className="text-green-600 font-medium">Success ({executionMetrics.successRate.toFixed(1)}%)</span>
            <span className="text-red-600 font-medium">Failed ({executionMetrics.failureRate.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-red-100 rounded-full h-2 flex overflow-hidden">
            <div 
              className="bg-green-500 h-2" 
              style={{ width: `${executionMetrics.successRate}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Average Runtime */}
      <div className="bg-white rounded-lg p-5 shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500 mb-1">Average Runtime</h3>
        <p className="text-3xl font-bold">{(executionMetrics.averageRuntime / 1000).toFixed(2)}s</p>
        <p className="text-sm text-gray-500 mt-2">
          {executionMetrics.inProgressCount} runs currently in-progress.
        </p>
      </div>

      {/* Token Usage */}
      <div className="bg-white rounded-lg p-5 shadow-sm border">
        <h3 className="text-sm font-medium text-gray-500 mb-1">AI Tokens Utilized</h3>
        <p className="text-3xl font-bold">{aiMetrics.totalTokens.toLocaleString()}</p>
        <p className="text-sm text-gray-500 mt-2">
          Estimated Cost: <span className="font-medium text-black">${aiMetrics.totalCost.toFixed(4)}</span>
        </p>
      </div>

      {/* Failure Categories */}
      <div className="bg-white rounded-lg p-5 shadow-sm border flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-2">Failure Categories (Recent)</h3>
          {executionMetrics.failedCount === 0 ? (
            <p className="text-sm text-green-600 font-medium">No recent failures!</p>
          ) : (
            <ul className="text-xs space-y-1">
              {Object.entries(executionMetrics.failureCategories)
                .filter(([_, count]) => count > 0)
                .map(([category, count]) => (
                  <li key={category} className="flex justify-between">
                    <span className="text-gray-600">{category}</span>
                    <span className="font-medium">{count}</span>
                  </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-xs text-red-600 font-medium mt-3">
          Total Failed: {executionMetrics.failedCount}
        </p>
      </div>
    </div>
  );
}
