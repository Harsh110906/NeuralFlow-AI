import Link from 'next/link';
import { ExecutionSummary } from '@/lib/api/analytics';

export function ExecutionList({ 
  executions, 
  onExecutionClick 
}: { 
  executions: ExecutionSummary[];
  onExecutionClick?: (id: string) => void;
}) {
  if (executions.length === 0) {
    return (
      <div className="bg-white rounded-lg p-8 shadow-sm border text-center text-gray-500">
        No recent executions found.
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">SUCCESS</span>;
      case 'FAILED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">FAILED</span>;
      case 'RUNNING':
      case 'PENDING':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">IN_PROGRESS</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Recent Workflow Traces</h2>
        <span className="text-xs text-gray-500">Replay Scrubber Foundation</span>
      </div>
      <div className="divide-y">
        {executions.map((exec) => (
          <div key={exec.id} className="p-4 hover:bg-gray-50 transition-colors flex flex-col md:flex-row justify-between md:items-center">
            <div className="flex items-center space-x-4">
              <div className="w-24">
                {getStatusBadge(exec.status)}
              </div>
              <div>
                <p className="font-medium">{exec.workflowName}</p>
                <div className="text-xs text-gray-500 flex space-x-3 mt-1">
                  <span>ID: <span className="font-mono">{exec.id.split('-')[0]}</span></span>
                  {exec.startedAt && <span>Started: {new Date(exec.startedAt).toLocaleTimeString()}</span>}
                </div>
              </div>
            </div>
            <div className="mt-3 md:mt-0 flex items-center space-x-6">
              <div className="text-right">
                <p className="text-sm font-medium">{(exec.durationMs / 1000).toFixed(2)}s</p>
                <p className="text-xs text-gray-500">{exec.tokenUsage.toLocaleString()} tokens</p>
              </div>
              <Link 
                href={`/analytics/replay/${exec.id}`}
                onClick={(e) => {
                  if (onExecutionClick) {
                    e.preventDefault();
                    onExecutionClick(exec.id);
                  }
                }}
                className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg text-sm font-medium transition-colors"
              >
                View Replay
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
