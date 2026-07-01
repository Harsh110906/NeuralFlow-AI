import { Activity, PlayCircle, AlertCircle, Bot, GitBranch, AlertTriangle } from "lucide-react";
import Link from 'next/link';
import { getPendingApprovals } from '@/lib/api/approvals';
import { auth } from '@clerk/nextjs/server';
import { getBootstrapWorkspaceId } from '@/lib/api/workspaces';

export default async function DashboardPage() {
  const { getToken } = await auth();
  const token = await getToken();
  const workspaceId = await getBootstrapWorkspaceId(token);

  if (!workspaceId) {
    return <div className="p-8 text-white max-w-6xl mx-auto">Loading workspace...</div>;
  }

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const res = await fetch(`${API_BASE}/workspaces/${workspaceId}`, { 
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store' 
  }).catch(() => null);
  
  const workspace = res?.ok ? await res.json() : null;
  const workflows = workspace?.workflows || [];
  const agents = workspace?.agents || [];

  const pendingApprovals = await getPendingApprovals(workspaceId, token).catch(() => []);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Command Center</h1>
        <p className="text-zinc-400 font-sans">Monitor active workflows and system health across your workspace.</p>
      </div>

      {pendingApprovals.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-yellow-500/20 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-yellow-500">Action Required: Pending Approvals</h2>
              <p className="text-sm text-yellow-500/80">
                You have {pendingApprovals.length} execution{pendingApprovals.length === 1 ? '' : 's'} waiting for human review.
              </p>
            </div>
          </div>
          <Link href="/approvals" className="bg-yellow-500 text-black px-4 py-2 rounded-lg font-bold hover:bg-yellow-400 transition-colors">
            Review Queue
          </Link>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-zinc-400 mb-3 font-mono text-xs uppercase">
            <GitBranch className="h-4 w-4 text-emerald-500" /> Workflows
          </div>
          <div className="text-3xl font-bold text-white">{workflows.length}</div>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-zinc-400 mb-3 font-mono text-xs uppercase">
            <Bot className="h-4 w-4 text-blue-500" /> Agents configured
          </div>
          <div className="text-3xl font-bold text-white">{agents.length}</div>
        </div>
        <div className="p-6 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-zinc-400 mb-3 font-mono text-xs uppercase">
            <Activity className="h-4 w-4 text-yellow-500" /> Active Executions
          </div>
          <div className="text-3xl font-bold text-white">0</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        {/* Workflows List */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Recent Workflows</h2>
          <div className="space-y-3">
            {workflows.map((wf: any) => (
              <Link href={`/workflows/${wf.id}`} key={wf.id}>
                <div className="block p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-yellow-500 transition-colors cursor-pointer mb-3">
                  <div className="font-bold text-white mb-1">{wf.name}</div>
                  <div className="text-sm text-zinc-400">{wf.description || 'No description'}</div>
                </div>
              </Link>
            ))}
            {workflows.length === 0 && (
              <div className="text-zinc-500 italic p-4 border border-dashed border-zinc-800 rounded-xl">No workflows yet</div>
            )}
          </div>
        </div>

        {/* Agents List */}
        <div>
          <h2 className="text-xl font-bold text-white mb-4">Your Agents</h2>
          <div className="space-y-3">
            {agents.map((agent: any) => (
              <Link href={`/agents/${agent.id}`} key={agent.id}>
                <div className="block p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:border-blue-500 transition-colors cursor-pointer mb-3">
                  <div className="font-bold text-white mb-1">{agent.name}</div>
                  <div className="text-sm text-zinc-400 font-mono text-xs">{agent.model}</div>
                </div>
              </Link>
            ))}
            {agents.length === 0 && (
              <div className="text-zinc-500 italic p-4 border border-dashed border-zinc-800 rounded-xl">No agents configured</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
