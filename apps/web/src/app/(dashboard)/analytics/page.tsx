import React from 'react';
import { getWorkspaceMetrics, getRecentExecutions } from '@/lib/api/analytics';
import { AnalyticsDashboardClient } from '@/components/analytics/analytics-dashboard-client';
import { auth } from '@clerk/nextjs/server';

const currentWorkspaceId = 'dummy-workspace-id';

export default async function AnalyticsDashboard() {
  let initialMetrics = null;
  let initialExecutions: any[] = [];
  let error = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    const [metrics, executions] = await Promise.all([
      getWorkspaceMetrics(currentWorkspaceId, token),
      getRecentExecutions(currentWorkspaceId, token)
    ]);
    initialMetrics = metrics;
    initialExecutions = executions;
  } catch (err: any) {
    error = err.message || 'Failed to load telemetry data.';
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Analytics & Observability</h1>
      <p className="text-gray-600 mb-8">
        Monitor agent swarms and debug workflow failures with the Replay Scrubber. 
        Powered by OpenTelemetry-compatible traces.
      </p>

      {error || !initialMetrics ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Access Error</p>
          <p className="text-sm">{error || 'Unable to retrieve workspace metrics.'}</p>
        </div>
      ) : (
        <AnalyticsDashboardClient 
          workspaceId={currentWorkspaceId} 
          initialMetrics={initialMetrics}
          initialExecutions={initialExecutions}
        />
      )}
    </div>
  );
}
