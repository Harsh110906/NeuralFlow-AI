import { auth } from '@clerk/nextjs/server';
import { getPendingApprovals } from '@/lib/api/executions';
import Link from 'next/link';
import { getBootstrapWorkspaceId } from '@/lib/api/workspaces';

export default async function ExecutionsPage() {
  const { getToken } = await auth();
  const token = await getToken();
  
  const workspaceId = await getBootstrapWorkspaceId(token);
  if (!workspaceId) return <div className="p-8 text-white">Loading workspace...</div>;
  
  const pendingApprovals = await getPendingApprovals(workspaceId, token).catch(() => []);

  return (
    <div className="p-8 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Executions</h1>
      <p className="text-zinc-400 mb-8">View real-time state machines and execution histories.</p>
      
      {pendingApprovals.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <span className="bg-yellow-500 text-black px-2 py-1 rounded text-xs font-bold mr-2">ACTION REQUIRED</span>
            Pending Approvals
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingApprovals.map(exec => (
              <Link key={exec.id} href={`/executions/${exec.id}`}>
                <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-lg hover:border-yellow-500 transition-colors cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-mono text-sm">{exec.id.split('-')[0]}...</span>
                    <span className="text-xs text-zinc-500">{new Date(exec.createdAt).toLocaleDateString()}</span>
                  </div>
                  <h3 className="font-medium text-lg mb-1">{exec.workflow?.name || 'Workflow'}</h3>
                  <p className="text-sm text-yellow-400 mb-4">Awaiting Human Approval</p>
                  <div className="text-sm font-medium text-black bg-white px-4 py-2 rounded text-center">
                    Review Request
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Placeholders for other execution lists */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Executions</h2>
        <div className="bg-zinc-900 border border-zinc-800 rounded p-8 text-center text-zinc-500">
          No recent executions.
        </div>
      </div>
    </div>
  );
}
