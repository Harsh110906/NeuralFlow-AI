'use client';

import React, { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { approveNode, rejectNode, Execution, ExecutionEvent } from '@/lib/api/executions';
import { useRouter } from 'next/navigation';

export function GovernanceCardClient({ execution }: { execution: Execution }) {
  const { getToken, userId } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Find the pause event to know which node is paused
  const pauseEvent = execution.events?.find(e => e.type === 'NODE_PAUSED');
  const approvalEvent = execution.events?.find(e => e.type === 'NODE_APPROVED' || e.type === 'NODE_REJECTED');

  // Node details extraction
  const nodeId = pauseEvent?.nodeId || 'unknown';
  const reason = pauseEvent?.data?.output?.reason || 'Approval required to proceed.';
  const nodeName = pauseEvent?.data?.output?.nodeId || nodeId;
  const executionInputs = pauseEvent?.data?.inputs || {};

  // We only show the card if we are in AWAITING_APPROVAL or if it was recently decided
  if (execution.status !== 'AWAITING_APPROVAL' && !approvalEvent) {
    return null;
  }

  const handleDecision = async (decision: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!userId) throw new Error("Not logged in");

      if (decision === 'approve') {
        await approveNode(execution.id, nodeId, userId, token);
      } else {
        await rejectNode(execution.id, nodeId, userId, token);
      }
      
      // Refresh the page to show updated status
      router.refresh();
    } catch (err: any) {
      setError(err.message || `Failed to ${decision} node`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-zinc-800 border border-yellow-600 rounded-lg overflow-hidden shadow-lg mb-8">
      <div className="bg-yellow-600 px-6 py-3 flex items-center">
        <svg className="w-5 h-5 text-white mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        <h2 className="text-white font-bold text-lg">Human-in-the-Loop Approval Required</h2>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Execution ID</h3>
            <p className="font-mono text-sm text-white">{execution.id}</p>
          </div>
          <div>
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Gated Action</h3>
            <p className="font-medium text-white">{nodeName} (Human Approval Node)</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Reason for Hold</h3>
            <p className="text-white bg-zinc-900 p-3 rounded border border-zinc-700 font-mono text-sm">
              {reason}
            </p>
          </div>
          {Object.keys(executionInputs).length > 0 && (
            <div className="md:col-span-2 mt-2">
              <h3 className="text-zinc-400 text-xs uppercase tracking-wider mb-1">Execution Context (Inputs)</h3>
              <pre className="text-white bg-zinc-950 p-3 rounded border border-zinc-800 font-mono text-xs overflow-x-auto">
                {JSON.stringify(executionInputs, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {error && (
          <div className="mb-4 bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {approvalEvent ? (
          <div className="bg-zinc-900 border border-zinc-700 p-4 rounded text-center">
            <p className="text-zinc-300">
              Decision made: <strong className={approvalEvent.type === 'NODE_APPROVED' ? 'text-green-500' : 'text-red-500'}>
                {approvalEvent.type.replace('NODE_', '')}
              </strong>
            </p>
            <p className="text-xs text-zinc-500 mt-1">
              By User ID: {approvalEvent.data?.userId || 'unknown'} at {new Date(approvalEvent.createdAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="flex gap-4">
            <button 
              onClick={() => handleDecision('approve')}
              disabled={loading}
              className="flex-1 bg-white text-black font-semibold py-3 rounded hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Approve & Resume'}
            </button>
            <button 
              onClick={() => handleDecision('reject')}
              disabled={loading}
              className="flex-1 bg-red-600 text-white font-semibold py-3 rounded hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Reject & Abort'}
            </button>
          </div>
        )}
        <p className="text-center text-xs text-zinc-500 mt-4">
          Note: Only Workspace Admins can approve or reject.
        </p>
      </div>
    </div>
  );
}
