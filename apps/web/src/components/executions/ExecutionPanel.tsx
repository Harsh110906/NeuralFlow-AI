'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, FastForward, SkipBack, Stethoscope, DollarSign, GitFork } from 'lucide-react';

export function ExecutionPanel({ executionId, workflowId, onClose }: { executionId: string, workflowId: string, onClose: () => void }) {
  const [execution, setExecution] = useState<any>(null);
  const [doctorMode, setDoctorMode] = useState<string | null>(null); // 'failure', 'cost', 'architecture'
  const [doctorResult, setDoctorResult] = useState<string>('');
  const [loadingDoctor, setLoadingDoctor] = useState(false);

  useEffect(() => {
    if (!executionId) return;
    const fetchExec = async () => {
      try {
        const res = await fetch(`http://localhost:3001/executions/${executionId}`);
        const data = await res.json();
        setExecution(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchExec();
    
    // Poll if running
    const interval = setInterval(() => {
      setExecution((prev: any) => {
        if (prev && ['COMPLETED', 'FAILED', 'CANCELLED'].includes(prev.status)) {
          clearInterval(interval);
        } else {
          fetchExec();
        }
        return prev;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, [executionId]);

  const callDoctor = async (mode: string) => {
    setDoctorMode(mode);
    setLoadingDoctor(true);
    setDoctorResult('');
    try {
      const url = mode === 'architecture' 
        ? `http://localhost:3001/observatory/doctor/architecture/${workflowId}`
        : `http://localhost:3001/observatory/doctor/${mode}/${executionId}`;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.text();
      setDoctorResult(data);
    } catch (err) {
      setDoctorResult('Failed to analyze.');
    } finally {
      setLoadingDoctor(false);
    }
  };

  if (!execution) return null;

  return (
    <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md shadow-2xl w-96 flex flex-col" style={{ maxHeight: 'calc(100vh - 100px)' }}>
      {/* Header */}
      <div className="flex justify-between items-center p-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="font-bold text-sm">Replay & Diagnostics</h3>
        <div className="flex gap-2 items-center">
          <span className={`text-xs font-bold px-2 py-1 rounded-md ${
            execution.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-800 animate-pulse' :
            execution.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-800' :
            execution.status === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
          }`}>
            {execution.status}
          </span>
          <button onClick={onClose} className="text-zinc-500 hover:text-white">&times;</button>
        </div>
      </div>

      {/* Tabs / Scrubber */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!doctorMode ? (
          <div>
            {/* Scrubber Controls (Visual mockup for now) */}
            <div className="flex items-center gap-2 mb-4 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-md justify-center">
              <SkipBack className="w-4 h-4 cursor-pointer text-zinc-400 hover:text-white" />
              <Play className="w-4 h-4 cursor-pointer text-zinc-400 hover:text-white" />
              <FastForward className="w-4 h-4 cursor-pointer text-zinc-400 hover:text-white" />
            </div>
            
            <div className="space-y-3 text-xs font-mono">
              {execution.events?.map((ev: any) => (
                <div key={ev.id} className="pb-3 border-b border-zinc-100 dark:border-zinc-800 last:border-0">
                  <div className="flex justify-between text-zinc-500 mb-1">
                    <span>{new Date(ev.createdAt).toLocaleTimeString()}</span>
                    <span>{ev.type}</span>
                  </div>
                  {ev.nodeId && <div className="text-blue-400">Node: {ev.nodeId}</div>}
                  
                  {/* Detailed Data */}
                  {ev.data && Object.keys(ev.data).length > 0 && (
                    <pre className="mt-1 bg-zinc-100 dark:bg-zinc-950 p-2 rounded text-zinc-300 overflow-x-auto">
                      {JSON.stringify(ev.data, null, 2)}
                    </pre>
                  )}
                  {/* Token Tracking */}
                  {ev.totalTokens > 0 && (
                    <div className="mt-1 text-emerald-500 flex justify-between">
                      <span>Tokens: {ev.totalTokens}</span>
                      <span>${ev.estimatedCost?.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-sm">
            <h4 className="font-bold capitalize mb-2">{doctorMode} Analysis</h4>
            {loadingDoctor ? (
              <div className="text-zinc-500 animate-pulse">Doctor is thinking...</div>
            ) : (
              <div className="text-zinc-300 prose prose-invert prose-sm">
                {doctorResult}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Doctor Action Bar */}
      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 flex gap-2 justify-between rounded-b-md">
        <button onClick={() => setDoctorMode(null)} className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 text-xs font-medium transition-colors ${!doctorMode ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          <Play className="w-3 h-3" /> Replay
        </button>
        <button onClick={() => callDoctor('failure')} className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 text-xs font-medium transition-colors ${doctorMode === 'failure' ? 'bg-red-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          <Stethoscope className="w-3 h-3" /> Fix
        </button>
        <button onClick={() => callDoctor('cost')} className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 text-xs font-medium transition-colors ${doctorMode === 'cost' ? 'bg-emerald-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          <DollarSign className="w-3 h-3" /> Cost
        </button>
        <button onClick={() => callDoctor('architecture')} className={`flex-1 py-1 px-2 rounded flex items-center justify-center gap-1 text-xs font-medium transition-colors ${doctorMode === 'architecture' ? 'bg-purple-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'}`}>
          <GitFork className="w-3 h-3" /> Arch
        </button>
      </div>
    </div>
  );
}
