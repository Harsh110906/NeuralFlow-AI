'use client';

import React, { useState } from 'react';
import { ExecutionDetail, ExecutionEvent } from '@/lib/api/analytics';

// Defense-in-depth frontend mask
function applyFrontendMask(obj: any): any {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(item => applyFrontendMask(item));
  
  const redacted = { ...obj };
  const sensitivePatterns = /secret|password|token|key|authorization|auth/i;
  
  for (const key of Object.keys(redacted)) {
    if (sensitivePatterns.test(key) && typeof redacted[key] === 'string') {
      if (redacted[key] !== '********') {
         redacted[key] = '[FRONTEND_REDACTED]';
      }
    } else if (typeof redacted[key] === 'object') {
      redacted[key] = applyFrontendMask(redacted[key]);
    }
  }
  return redacted;
}

const getEventColor = (type: string) => {
  if (type.includes('FAILED')) return 'bg-red-500';
  if (type.includes('COMPLETED') || type === 'EXECUTION_STARTED') return 'bg-green-500';
  if (type.includes('RETRY')) return 'bg-amber-500';
  if (type.includes('TOOL') || type.includes('AGENT')) return 'bg-purple-500';
  return 'bg-blue-500';
};

export function ReplayScrubberClient({ detail }: { detail: ExecutionDetail }) {
  const [selectedEventIndex, setSelectedEventIndex] = useState<number>(0);

  const events: ExecutionEvent[] = detail.events || [];
  
  if (!events || events.length === 0) {
    return <div className="p-8 text-center text-gray-500">No events found in this execution trace.</div>;
  }

  const selectedEvent = events[selectedEventIndex];
  const safeData = applyFrontendMask(selectedEvent.data);

  return (
    <div className="flex-1 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-gray-800 rounded-xl">
      
      {/* LEFT PANEL - TIMELINE STEPPER */}
      <div className="w-full md:w-1/3 flex flex-col border-r border-gray-200 dark:border-gray-800">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900 flex justify-between items-center shrink-0">
          <h3 className="font-semibold text-sm">Execution Timeline</h3>
          <span className="text-xs text-gray-500">{events.length} Events</span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {events.map((event, index) => {
            const isSelected = index === selectedEventIndex;
            return (
              <button
                key={event.id}
                onClick={() => setSelectedEventIndex(index)}
                className={`w-full text-left p-3 rounded-lg border flex gap-3 transition-colors ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                    : 'border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-zinc-900'
                }`}
              >
                <div className="flex flex-col items-center mt-1">
                  <div className={`w-3 h-3 rounded-full shadow-sm ${getEventColor(event.eventType)}`} />
                  {index < events.length - 1 && (
                    <div className={`w-px h-full mt-1 ${isSelected ? 'bg-blue-300' : 'bg-gray-200 dark:bg-gray-700'}`} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className={`text-sm font-semibold truncate ${isSelected ? 'text-blue-700 dark:text-blue-400' : ''}`}>
                      {event.eventType}
                    </p>
                    <span className="text-[10px] text-gray-400 font-mono shrink-0 ml-2">
                      {new Date(event.timestamp).toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 })}
                    </span>
                  </div>
                  {event.nodeId && (
                    <p className="text-xs text-gray-500 truncate">Node: {event.nodeId}</p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL - INSPECTOR */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-zinc-900 shrink-0">
          <div className="flex items-center gap-3">
             <div className={`w-4 h-4 rounded-full ${getEventColor(selectedEvent.eventType)}`} />
             <h3 className="font-bold text-lg">{selectedEvent.eventType}</h3>
          </div>
          <div className="mt-2 text-sm text-gray-600 dark:text-gray-400 flex flex-wrap gap-4">
             <span><strong>Time:</strong> {new Date(selectedEvent.timestamp).toLocaleString()}</span>
             {selectedEvent.nodeId && <span><strong>Node ID:</strong> <code className="bg-gray-200 dark:bg-zinc-800 px-1 rounded">{selectedEvent.nodeId}</code></span>}
             {selectedEvent.model && <span><strong>Model:</strong> {selectedEvent.model}</span>}
          </div>
        </div>

        <div className="p-6 flex-1 space-y-6">
          
          {(selectedEvent.promptTokens! > 0 || selectedEvent.completionTokens! > 0) && (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800">
                <p className="text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1 uppercase tracking-wider">Prompt Tokens</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{selectedEvent.promptTokens}</p>
              </div>
              <div className="p-4 rounded-lg bg-teal-50 border border-teal-100 dark:bg-teal-900/20 dark:border-teal-800">
                <p className="text-xs font-semibold text-teal-800 dark:text-teal-300 mb-1 uppercase tracking-wider">Completion Tokens</p>
                <p className="text-2xl font-bold text-teal-900 dark:text-teal-100">{selectedEvent.completionTokens}</p>
              </div>
            </div>
          )}

          <div>
            <h4 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-3">Payload Data</h4>
            {safeData ? (
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm font-mono shadow-inner">
                {JSON.stringify(safeData, null, 2)}
              </pre>
            ) : (
              <div className="text-sm text-gray-500 italic p-4 bg-gray-50 dark:bg-zinc-900 rounded-lg">No payload data recorded for this event.</div>
            )}
          </div>

        </div>
      </div>

    </div>
  );
}
