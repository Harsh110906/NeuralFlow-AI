'use client';

import React from 'react';
import { ExecutionDetail } from '@/lib/api/analytics';
import { ReplayScrubberClient } from './replay/ReplayScrubberClient';
import { X } from 'lucide-react';

interface Props {
  execution: ExecutionDetail;
  onClose: () => void;
}

export function ExecutionScrubberModal({ execution, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-zinc-950 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-zinc-800">
          <h2 className="text-xl font-bold">Execution Inspector: {execution.id}</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-hidden flex flex-col p-4 bg-gray-50 dark:bg-zinc-900">
           <ReplayScrubberClient detail={execution} />
        </div>
      </div>
    </div>
  );
}
