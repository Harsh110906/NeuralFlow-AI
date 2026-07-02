/* eslint-disable react-hooks/set-state-in-effect */
import { useState, useEffect } from 'react';
import { Node } from '@xyflow/react';

export function NodeSettings({ 
  selectedNode, 
  onUpdateNode,
  workspaceId
}: { 
  selectedNode: Node | null; 
  onUpdateNode: (nodeId: string, newData: any) => void;
  workspaceId: string;
}) {
  const [label, setLabel] = useState('');
  const [systemPrompt, setSystemPrompt] = useState('');
  
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label as string || '');
      setSystemPrompt((selectedNode.data.overrideConfig as any)?.systemPrompt || (selectedNode.data as any).systemPrompt || '');
    }
  }, [selectedNode]);

  if (!selectedNode) {
    return (
      <div className="p-8 text-center text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
        <p>Select a node on the canvas to view and edit its settings.</p>
      </div>
    );
  }

  const handleUpdate = (updates: any) => {
    onUpdateNode(selectedNode.id, updates);
  };

  return (
    <div className="p-4 flex flex-col gap-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="px-2 py-1 bg-gray-100 dark:bg-zinc-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded uppercase tracking-wider">
          {selectedNode.type} Node
        </span>
        <span className="text-xs text-gray-400 font-mono truncate">{selectedNode.id}</span>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Node Name</label>
        <input 
          type="text" 
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => handleUpdate({ label })}
          className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          placeholder="e.g. My Webhook"
        />
      </div>

      {selectedNode.type === 'agent' && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex justify-between">
              <span>Agent System Prompt</span>
              <span className="text-amber-500 font-normal">Local Override</span>
            </label>
            <textarea 
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              onBlur={() => {
                handleUpdate({ 
                  overrideConfig: { 
                    ...((selectedNode.data.overrideConfig as any) || {}), 
                    systemPrompt 
                  }
                });
              }}
              rows={6}
              className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700/50 rounded-md text-sm bg-amber-50/50 dark:bg-amber-900/10 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-mono text-xs"
              placeholder="You are a helpful assistant..."
            />
            <p className="text-[10px] text-gray-500">Changes here apply only to this specific workflow node, preserving the base agent asset.</p>
          </div>
          
          <button className="w-full py-2 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors">
            Save to Base Agent...
          </button>
        </div>
      )}

      {selectedNode.type === 'trigger' && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Webhook URL</label>
            <div className="flex">
              <input 
                type="text" 
                readOnly 
                value={`https://api.neuralflow.com/v1/hooks/${workspaceId}/${selectedNode.id}`}
                className="flex-1 px-3 py-2 border border-r-0 border-gray-300 dark:border-zinc-700 rounded-l-md text-sm bg-gray-50 dark:bg-zinc-800/50 text-gray-500 font-mono text-[10px]"
              />
              <button className="px-3 py-2 bg-gray-100 dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-r-md hover:bg-gray-200 dark:hover:bg-zinc-700">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
