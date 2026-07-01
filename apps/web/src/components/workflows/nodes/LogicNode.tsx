import { Handle, Position } from '@xyflow/react';

export function LogicNode({ data }: { data: any }) {
  let borderColor = 'border-purple-500';
  if (data.status === 'RUNNING') borderColor = 'border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse';
  else if (data.status === 'COMPLETED') borderColor = 'border-emerald-500 bg-emerald-50';
  else if (data.status === 'FAILED') borderColor = 'border-red-500 bg-red-50';

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[150px] transition-all ${borderColor}`}>
      <Handle type="target" position={Position.Top} className="w-3 h-3 bg-purple-500" />
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-purple-100 text-purple-600 font-bold mr-2">
          L
        </div>
        <div>
          <div className="text-sm font-bold text-gray-800">{data.label || 'Logic'}</div>
          <div className="text-xs text-gray-500">Condition/Flow</div>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="a" style={{ left: 30 }} className="w-3 h-3 bg-purple-500" />
      <Handle type="source" position={Position.Bottom} id="b" style={{ left: 'auto', right: 30 }} className="w-3 h-3 bg-purple-500" />
    </div>
  );
}
