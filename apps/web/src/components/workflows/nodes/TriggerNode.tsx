import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useDensity, useSemanticZoom } from '../contexts/WorkflowContexts';

function TriggerNodeComponent({ data, selected }: { data: any, selected?: boolean }) {
  const { density } = useDensity();
  const zoom = useSemanticZoom();
  
  const isZoomedOut = zoom < 0.6;
  const isCompact = density === 'compact' || isZoomedOut;

  let borderColor = selected ? 'border-emerald-500 ring-4 ring-emerald-500/20 shadow-emerald-500/20' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600';
  
  // Triggers typically don't have RUNNING/COMPLETED since they start the flow, but just in case:
  const statusOverlay = null;
  if (data.status === 'RUNNING') {
    borderColor = 'border-emerald-400 ring-4 ring-emerald-400/30';
  } else if (data.status === 'COMPLETED') {
    borderColor = 'border-emerald-500 ring-2 ring-emerald-500/20';
  }

  return (
    <div className={`relative flex flex-col bg-white dark:bg-zinc-900 border ${borderColor} rounded-xl shadow-md transition-all duration-200 min-w-[200px] overflow-visible group`}>
      {/* Node Accent Left Border */}
      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-500 rounded-l-xl opacity-80" />

      {statusOverlay}

      {/* Node Header */}
      <div className={`flex items-center gap-3 ${isCompact ? 'p-3' : 'px-4 py-3'}`}>
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
          {data.subType === 'email' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          ) : data.subType === 'manual' ? (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          )}
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{data.label || 'Trigger'}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">
            {data.subType === 'email' ? 'Email Trigger' : data.subType === 'manual' ? 'Manual Trigger' : 'Webhook Trigger'}
          </div>
        </div>
      </div>

      {/* Source Handle (Right) */}
      <Handle 
        id="source" 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 -right-1.5 z-10 transition-transform hover:scale-125" 
      />
    </div>
  );
}

export const TriggerNode = memo(TriggerNodeComponent);
