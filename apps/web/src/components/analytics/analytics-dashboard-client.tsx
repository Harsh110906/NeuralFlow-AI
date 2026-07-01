'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { WorkspaceMetrics, ExecutionSummary, getWorkspaceMetrics, getRecentExecutions, getExecutionDetail, ExecutionDetail } from '@/lib/api/analytics';
import { MetricsGrid } from './metrics-grid';
import { ExecutionList } from './execution-list';
import { ExecutionScrubberModal } from './execution-scrubber-modal';

export function AnalyticsDashboardClient({
  workspaceId,
  initialMetrics,
  initialExecutions
}: {
  workspaceId: string;
  initialMetrics: WorkspaceMetrics;
  initialExecutions: ExecutionSummary[];
}) {
  const { getToken } = useAuth();
  const [metrics, setMetrics] = useState<WorkspaceMetrics>(initialMetrics);
  const [executions, setExecutions] = useState<ExecutionSummary[]>(initialExecutions);
  const [selectedExecutionId, setSelectedExecutionId] = useState<string | null>(null);
  const [selectedExecutionDetail, setSelectedExecutionDetail] = useState<ExecutionDetail | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleExecutionClick = async (executionId: string) => {
    try {
      const token = await getToken();
      const detail = await getExecutionDetail(workspaceId, executionId, token);
      setSelectedExecutionDetail(detail);
      setSelectedExecutionId(executionId);
    } catch (err) {
      console.error('Failed to load execution details', err);
    }
  };

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        setIsRefreshing(true);
        const token = await getToken();
        const [newMetrics, newExecutions] = await Promise.all([
          getWorkspaceMetrics(workspaceId, token),
          getRecentExecutions(workspaceId, token)
        ]);
        setMetrics(newMetrics);
        setExecutions(newExecutions);
      } catch (err: any) {
        console.error('Polling failed:', err);
      } finally {
        setIsRefreshing(false);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [workspaceId]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold">Workspace Telemetry</h2>
          <p className="text-sm text-gray-500">Live updating metrics based on execution traces.</p>
        </div>
        {isRefreshing && (
          <span className="text-xs text-gray-400 animate-pulse">Syncing...</span>
        )}
      </div>

      <MetricsGrid metrics={metrics} />
      
      <ExecutionList 
        executions={executions} 
        onExecutionClick={handleExecutionClick} 
      />

      {selectedExecutionId && selectedExecutionDetail && (
        <ExecutionScrubberModal
          execution={selectedExecutionDetail}
          onClose={() => {
            setSelectedExecutionId(null);
            setSelectedExecutionDetail(null);
          }}
        />
      )}
    </div>
  );
}
