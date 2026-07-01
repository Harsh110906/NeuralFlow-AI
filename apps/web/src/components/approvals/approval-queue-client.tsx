'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { submitDecision, ApprovalRequestDto } from '@/lib/api/approvals';

export function ApprovalQueueClient({ workspaceId, initialPending, initialHistory }: { workspaceId: string, initialPending: ApprovalRequestDto[], initialHistory: ApprovalRequestDto[] }) {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequestDto | null>(null);
  
  // Decision Form State
  const [decisionReason, setDecisionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const displayList = activeTab === 'pending' ? initialPending : initialHistory;

  const handleDecision = async (decision: 'APPROVED' | 'REJECTED') => {
    if (!selectedApproval) return;
    
    if (decision === 'REJECTED' && !decisionReason.trim()) {
      setErrorMsg('You must provide a reason for rejecting this execution.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    
    try {
      const token = await getToken();
      await submitDecision(workspaceId, selectedApproval.id, decision, decisionReason, token);
      alert(`Successfully ${decision.toLowerCase()} request.`);
      setSelectedApproval(null);
      setDecisionReason('');
      router.refresh(); // Refresh RSC data
    } catch (e: any) {
      setErrorMsg(e.message || 'Failed to submit decision. Ensure you have Admin privileges.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      
      {/* Left List Pane */}
      <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col h-[600px]">
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button 
            onClick={() => { setActiveTab('pending'); setSelectedApproval(null); }} 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'pending' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            Pending ({initialPending.length})
          </button>
          <button 
            onClick={() => { setActiveTab('history'); setSelectedApproval(null); }} 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === 'history' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {displayList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No {activeTab} approvals found.
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {displayList.map(item => (
                <li 
                  key={item.id} 
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selectedApproval?.id === item.id ? 'bg-blue-50' : ''}`}
                  onClick={() => {
                    setSelectedApproval(item);
                    setDecisionReason('');
                    setErrorMsg('');
                  }}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-gray-900">{item.actionTarget}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                      item.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      item.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      item.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                  <div className="text-sm text-gray-500 truncate mb-2">{item.reason}</div>
                  <div className="flex justify-between text-xs text-gray-400">
                    <span>Requested: {new Date(item.createdAt).toLocaleDateString()}</span>
                    <span>Node: {item.nodeName}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Right Context Panel */}
      <div className="w-full md:w-1/2 bg-white border rounded-lg shadow-sm h-[600px] flex flex-col">
        {!selectedApproval ? (
          <div className="flex-1 flex items-center justify-center text-gray-500 p-8 text-center">
            Select an approval request from the list to view its execution context and submit a decision.
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <h2 className="font-bold text-gray-900 text-lg">{selectedApproval.actionTarget}</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedApproval.reason}</p>
            </div>

            <div className="p-4 flex-1 overflow-y-auto space-y-6">
              
              {/* Context Summary */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Execution Context</h3>
                <div className="text-sm bg-gray-50 p-3 rounded border text-gray-700">
                  {selectedApproval.executionSummary || 'No execution summary provided.'}
                </div>
              </div>

              {/* Payload Snapshot */}
              <div>
                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Immutable Action Payload</h3>
                <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-xs overflow-x-auto">
                  <pre>{JSON.stringify(selectedApproval.payloadSnapshot, null, 2)}</pre>
                </div>
                <p className="text-xs text-gray-400 mt-1">If approved, the execution will resume specifically against this frozen payload snapshot.</p>
              </div>

              {/* History Details */}
              {activeTab === 'history' && (
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-md">
                  <h3 className="text-sm font-semibold text-blue-900 mb-2">Decision Record</h3>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p><strong>Status:</strong> {selectedApproval.status}</p>
                    <p><strong>Decided By:</strong> {selectedApproval.approvedBy || 'System'}</p>
                    <p><strong>Date:</strong> {selectedApproval.approvedAt ? new Date(selectedApproval.approvedAt).toLocaleString() : 'N/A'}</p>
                    {selectedApproval.decisionReason && (
                      <div className="mt-2 pt-2 border-t border-blue-200">
                        <strong>Reason:</strong> {selectedApproval.decisionReason}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Decision Actions (Only for Pending) */}
            {activeTab === 'pending' && (
              <div className="p-4 border-t border-gray-200 bg-white space-y-4">
                {errorMsg && <div className="text-sm text-red-600 bg-red-50 p-2 rounded">{errorMsg}</div>}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Decision Reason (Required for rejection)</label>
                  <textarea 
                    value={decisionReason}
                    onChange={e => setDecisionReason(e.target.value)}
                    placeholder="Provide notes or an explanation for this decision..."
                    className="w-full p-2 border rounded text-sm focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => handleDecision('REJECTED')}
                    disabled={isSubmitting}
                    className="flex-1 bg-white border border-red-200 text-red-600 hover:bg-red-50 py-2 px-4 rounded font-medium disabled:opacity-50"
                  >
                    Reject Execution
                  </button>
                  <button 
                    onClick={() => handleDecision('APPROVED')}
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 text-white hover:bg-blue-700 py-2 px-4 rounded font-medium disabled:opacity-50"
                  >
                    Approve & Resume
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
