import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { useDensity, useSemanticZoom } from '../contexts/WorkflowContexts';

function LogicNodeComponent({ data, selected }: { data: any, selected?: boolean }) {
  const { density } = useDensity();
  const zoom = useSemanticZoom();
  
  const isZoomedOut = zoom < 0.6;
  const isCompact = density === 'compact' || isZoomedOut;

  let borderColor = selected ? 'border-purple-500 ring-4 ring-purple-500/20 shadow-purple-500/20' : 'border-gray-200 dark:border-zinc-700 hover:border-gray-300 dark:hover:border-zinc-600';
  let statusOverlay = null;

  if (data.status === 'RUNNING') {
    borderColor = 'border-purple-400 ring-4 ring-purple-400/30';
    if (!isCompact) {
      statusOverlay = (
        <div className="absolute -top-3 -right-3">
          <span className="flex h-6 w-6 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-6 w-6 bg-purple-500 border-2 border-white dark:border-zinc-900 items-center justify-center">
              <svg className="w-3 h-3 text-white animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            </span>
          </span>
        </div>
      );
    }
  } else if (data.status === 'COMPLETED') {
    borderColor = 'border-emerald-500 ring-2 ring-emerald-500/20';
    if (!isCompact) {
      statusOverlay = (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white rounded-full p-0.5 border-2 border-white dark:border-zinc-900">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
        </div>
      );
    }
  } else if (data.status === 'FAILED') {
    borderColor = 'border-red-500 ring-2 ring-red-500/20';
    if (!isCompact) {
      statusOverlay = (
        <div className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 border-2 border-white dark:border-zinc-900">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
        </div>
      );
    }
  } else if (data.status === 'SKIPPED') {
    borderColor = 'border-gray-400 dark:border-gray-600 border-dashed opacity-60';
  }

  return (
    <div className={`relative flex flex-col bg-white dark:bg-zinc-900 border ${borderColor} rounded-xl shadow-md transition-all duration-200 min-w-[200px] overflow-visible group`}>
      {/* Node Accent Left Border */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${data.status === 'SKIPPED' ? 'bg-gray-400' : 'bg-purple-500'} rounded-l-xl opacity-80`} />

      {/* Target Handle (Left) */}
      <Handle 
        id="target" 
        type="target" 
        position={Position.Left} 
        className={`w-3 h-3 bg-gray-200 dark:bg-zinc-700 border-2 border-white dark:border-zinc-900 -left-1.5 z-10 transition-colors ${data.status === 'SKIPPED' ? '' : 'hover:bg-purple-400'} hover:scale-125`} 
      />

      {statusOverlay}

      {/* Node Header */}
      <div className={`flex items-center gap-3 ${isCompact ? 'p-3' : 'px-4 py-3'} ${data.status === 'SKIPPED' ? 'opacity-60' : ''}`}>
        <div className={`w-8 h-8 rounded-lg ${data.status === 'SKIPPED' ? 'bg-gray-100 text-gray-500 dark:bg-zinc-800' : 'bg-purple-50 dark:bg-purple-500/10 border border-purple-100 dark:border-purple-500/20 text-purple-600 dark:text-purple-400'} flex items-center justify-center shrink-0`}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
        </div>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{data.label || 'Logic Router'}</div>
          <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-semibold tracking-wider">Branch / Filter</div>
        </div>
      </div>

      {/* Source Handle (Right) */}
      <Handle 
        id="source" 
        type="source" 
        position={Position.Right} 
        className="w-3 h-3 bg-purple-500 border-2 border-white dark:border-zinc-900 -right-1.5 z-10 transition-transform hover:scale-125" 
      />
    </div>
  );
}

export const LogicNode = memo(LogicNodeComponent);
