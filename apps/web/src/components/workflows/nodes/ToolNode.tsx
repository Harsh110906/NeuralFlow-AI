import { Handle, Position } from '@xyflow/react';

export function ToolNode({ data, selected }: { data: any, selected?: boolean }) {
  let borderColor = selected ? 'border-indigo-500 ring-4 ring-indigo-500/20' : 'border-orange-500';
  if (data.status === 'RUNNING') borderColor = 'border-yellow-400 ring-4 ring-yellow-400/50 animate-pulse';
  else if (data.status === 'COMPLETED') borderColor = 'border-emerald-500 bg-emerald-50';
  else if (data.status === 'FAILED') borderColor = 'border-red-500 bg-red-50';

  return (
    <div className={`px-4 py-2 shadow-md rounded-md bg-white border-2 min-w-[150px] transition-all ${borderColor}`}>
      <Handle id="target" type="target" position={Position.Top} className="w-3 h-3 bg-orange-500" />
      <div className="flex items-center">
        <div className="rounded-full w-8 h-8 flex items-center justify-center bg-orange-100 text-orange-600 font-bold mr-2">
          X
        </div>
        <div>
          <div className="text-sm font-bold text-gray-800">{data.label || 'Tool'}</div>
          <div className="text-xs text-gray-500">API execution</div>
        </div>
      </div>
      <Handle id="source" type="source" position={Position.Bottom} className="w-3 h-3 bg-orange-500" />
    </div>
  );
}
