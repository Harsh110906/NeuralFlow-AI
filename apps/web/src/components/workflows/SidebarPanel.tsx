import { useState } from 'react';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { NodeSettings } from './NodeSettings';
import { Node } from '@xyflow/react';

export function SidebarPanel({
  workspaceId,
  selectedNode,
  onUpdateNode,
  onClose,
  onGenerateWorkflow,
}: {
  workspaceId: string;
  selectedNode: Node | null;
  onUpdateNode: (nodeId: string, newData: any) => void;
  onClose: () => void;
  onGenerateWorkflow: (dagJson: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<'copilot' | 'settings'>(selectedNode ? 'settings' : 'copilot');

  // If a node gets selected while panel is open, auto-switch to settings tab
  if (selectedNode && activeTab === 'copilot' && !window.__preventAutoTabSwitch) {
    setActiveTab('settings');
    window.__preventAutoTabSwitch = true;
    setTimeout(() => { window.__preventAutoTabSwitch = false; }, 100);
  }

  return (
    <div className="absolute top-4 right-4 z-20 w-80 bg-white dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-2xl flex flex-col overflow-hidden h-[calc(100vh-120px)] transition-all">
      <div className="flex border-b border-gray-200 dark:border-zinc-800">
        <button
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'copilot' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
          onClick={() => setActiveTab('copilot')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Copilot
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'settings' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50 dark:bg-indigo-900/10' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-900'}`}
          onClick={() => setActiveTab('settings')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          Settings
        </button>
        <button onClick={onClose} className="px-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeTab === 'copilot' ? (
          <CopilotPanel 
            onClose={() => {}} 
            onGenerateWorkflow={onGenerateWorkflow} 
            workspaceId={workspaceId} 
            hideHeader={true}
          />
        ) : (
          <NodeSettings 
            selectedNode={selectedNode} 
            onUpdateNode={onUpdateNode} 
            workspaceId={workspaceId} 
          />
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __preventAutoTabSwitch?: boolean;
  }
}
