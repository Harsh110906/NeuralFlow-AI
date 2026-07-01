'use client';

import { useState, useEffect } from 'react';
import { Activity, Brain, Server, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export default function ObservatoryPage() {
  const [metrics, setMetrics] = useState<any>(null);

  useEffect(() => {
    // In a real app we'd get workspaceId from auth/context
    const workspaceId = 'production'; 
    const fetchMetrics = async () => {
      try {
        const res = await fetch(`http://localhost:3001/observatory/metrics/${workspaceId}`);
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        setMetrics(data);
      } catch (err) {
        console.error('Failed to load metrics', err);
      }
    };
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!metrics) {
    return <div className="p-8 text-zinc-500 animate-pulse font-mono">Loading Neural Observatory...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Neural Observatory</h1>
        <p className="text-zinc-400 text-sm mt-1">Real-time metrics, diagnostics, and AI token tracking.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Execution Metrics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 mb-4 font-mono text-xs uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-500" />
            Execution Health
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-light text-white">{metrics.executionMetrics.totalExecutions}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Executions</div>
            </div>
            <div>
              <div className="text-3xl font-light text-white">{metrics.executionMetrics.successRate.toFixed(1)}%</div>
              <div className="text-xs text-zinc-500 mt-1">Success Rate</div>
            </div>
            <div>
              <div className="text-xl font-light text-red-400">{metrics.executionMetrics.failureRate.toFixed(1)}%</div>
              <div className="text-xs text-zinc-500 mt-1">Failure Rate</div>
            </div>
            <div>
              <div className="text-xl font-light text-zinc-300">{(metrics.executionMetrics.averageRuntime / 1000).toFixed(2)}s</div>
              <div className="text-xs text-zinc-500 mt-1">Avg. Runtime</div>
            </div>
          </div>
        </div>

        {/* AI Metrics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 mb-4 font-mono text-xs uppercase tracking-wider">
            <Brain className="w-4 h-4 text-purple-500" />
            Neural Footprint
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-light text-white">{metrics.aiMetrics.totalTokens.toLocaleString()}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Tokens</div>
            </div>
            <div>
              <div className="text-3xl font-light text-white">${metrics.aiMetrics.totalCost.toFixed(4)}</div>
              <div className="text-xs text-zinc-500 mt-1">Total Cost</div>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-800 text-xs text-zinc-500 flex justify-between">
            <span>Primary Model</span>
            <span className="text-zinc-300 font-mono">gpt-4o-mini</span>
          </div>
        </div>

        {/* System Metrics */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 mb-4 font-mono text-xs uppercase tracking-wider">
            <Server className="w-4 h-4 text-blue-500" />
            System Scale
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-3xl font-light text-white">{metrics.systemMetrics.activeWorkflows}</div>
              <div className="text-xs text-zinc-500 mt-1">Active Workflows</div>
            </div>
            <div>
              <div className="text-3xl font-light text-white">{metrics.systemMetrics.activeAgents}</div>
              <div className="text-xs text-zinc-500 mt-1">Active Agents</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Expanded Sections placeholder */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 min-h-[300px] flex items-center justify-center text-zinc-500 font-mono text-sm shadow-sm">
        <div className="text-center">
          <Activity className="w-8 h-8 mx-auto mb-3 text-zinc-700" />
          Execution trends chart and detailed logs will mount here...
        </div>
      </div>
    </div>
  );
}
