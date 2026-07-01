import React from 'react';
import { getPendingApprovals, getApprovalHistory } from '@/lib/api/approvals';
import { auth } from '@clerk/nextjs/server';
import { ApprovalQueueClient } from '@/components/approvals/approval-queue-client';

const currentWorkspaceId = 'dummy-workspace-id';

export default async function ApprovalsPage() {
  let pending: any[] = [];
  let history: any[] = [];
  let error: string | null = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    
    // Fetch both queues
    const [pendingData, historyData] = await Promise.all([
      getPendingApprovals(currentWorkspaceId, token),
      getApprovalHistory(currentWorkspaceId, token)
    ]);
    
    pending = pendingData;
    history = historyData;
  } catch (err: any) {
    error = err.message || 'Failed to load approvals';
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Governance Queue</h1>
        <p className="text-gray-500">
          Review and approve paused workflow executions. Only Workspace Admins can make decisions.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>
      ) : (
        <ApprovalQueueClient 
          workspaceId={currentWorkspaceId} 
          initialPending={pending} 
          initialHistory={history} 
        />
      )}
    </div>
  );
}
