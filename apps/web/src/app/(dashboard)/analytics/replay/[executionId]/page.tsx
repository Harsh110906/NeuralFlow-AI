import React from 'react';
import { getExecutionDetail } from '@/lib/api/analytics';
import { ReplayScrubberClient } from '@/components/analytics/replay/ReplayScrubberClient';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function ReplayPage(props: { params: Promise<{ executionId: string }> }) {
  const params = await props.params;
  const currentWorkspaceId = 'dummy-workspace-id';
  let executionDetail = null;
  let error = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    executionDetail = await getExecutionDetail(currentWorkspaceId, params.executionId, token);
  } catch (err: any) {
    error = err.message || 'Failed to load execution details.';
  }

  return (
    <div className="p-8 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="mb-6 flex justify-between items-end">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <Link href="/analytics" className="text-gray-500 hover:text-gray-900 transition-colors">
              &larr; Back to Analytics
            </Link>
            <span className="text-gray-300">|</span>
            <span className="text-sm font-mono text-gray-500">Exec: {params.executionId.split('-')[0]}</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            {executionDetail?.workflowName || 'Execution Replay'}
          </h1>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Error loading replay data</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : executionDetail ? (
        <ReplayScrubberClient detail={executionDetail} />
      ) : null}
    </div>
  );
}
