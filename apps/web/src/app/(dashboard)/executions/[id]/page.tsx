import { auth } from '@clerk/nextjs/server';
import { getExecution } from '@/lib/api/executions';
import { GovernanceCardClient } from '@/components/executions/governance-card';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function ExecutionDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { getToken } = await auth();
  const token = await getToken();
  
  let execution;
  try {
    execution = await getExecution(params.id, token);
  } catch (err) {
    notFound();
  }

  return (
    <div className="p-8 text-white max-w-4xl mx-auto">
      <Link href="/executions" className="text-zinc-400 hover:text-white mb-6 inline-block flex items-center">
        &larr; Back to Executions
      </Link>
      
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Execution Details</h1>
          <p className="text-zinc-400 font-mono text-sm">{execution.id}</p>
        </div>
        <div>
          <span className={`px-3 py-1 text-sm rounded-full font-bold
            ${execution.status === 'COMPLETED' ? 'bg-green-500 text-black' : ''}
            ${execution.status === 'FAILED' ? 'bg-red-500 text-white' : ''}
            ${execution.status === 'RUNNING' ? 'bg-blue-500 text-white' : ''}
            ${execution.status === 'PENDING' ? 'bg-zinc-500 text-white' : ''}
            ${execution.status === 'AWAITING_APPROVAL' ? 'bg-yellow-500 text-black' : ''}
          `}>
            {execution.status}
          </span>
        </div>
      </div>

      <GovernanceCardClient execution={execution} />

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Event Log</h2>
        {execution.events && execution.events.length > 0 ? (
          <div className="space-y-4">
            {execution.events.map(event => (
              <div key={event.id} className="border-l-2 border-zinc-700 pl-4 py-1">
                <p className="text-xs text-zinc-500 mb-1">{new Date(event.createdAt).toLocaleString()}</p>
                <p className="font-medium">{event.type} {event.nodeId ? `(Node: ${event.nodeId})` : ''}</p>
                {event.data && (
                  <pre className="text-xs text-zinc-400 mt-2 bg-zinc-950 p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-500">No events recorded yet.</p>
        )}
      </div>
    </div>
  );
}
