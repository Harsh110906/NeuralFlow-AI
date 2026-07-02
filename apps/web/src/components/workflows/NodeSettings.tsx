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
  const [config, setConfig] = useState<any>({});
  
  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label as string || '');
      // Handle legacy overrideConfig and new config object
      let newConfig = { ...(selectedNode.data.config as any) };
      if (selectedNode.data.overrideConfig) {
        newConfig = { ...newConfig, ...(selectedNode.data.overrideConfig as any) };
      }
      setConfig(newConfig);
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

  const updateConfig = (key: string, value: any) => {
    const updatedConfig = { ...config, [key]: value };
    setConfig(updatedConfig);
    handleUpdate({ config: updatedConfig });
  };

  const subType = selectedNode.data.subType as string;

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
          placeholder="e.g. My Node"
        />
      </div>

      {/* --- AGENT NODE SETTINGS --- */}
      {selectedNode.type === 'agent' && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Model</label>
            <select 
              value={config.model || 'gpt-4o'}
              onChange={(e) => updateConfig('model', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="gpt-4o">GPT-4o (OpenAI)</option>
              <option value="claude-3.5-sonnet">Claude 3.5 Sonnet (Anthropic)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Google)</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 flex justify-between">
              <span>Agent System Prompt</span>
              <span className="text-amber-500 font-normal">Local Override</span>
            </label>
            <textarea 
              value={config.systemPrompt || ''}
              onChange={(e) => updateConfig('systemPrompt', e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-amber-300 dark:border-amber-700/50 rounded-md text-sm bg-amber-50/50 dark:bg-amber-900/10 focus:ring-2 focus:ring-amber-500 focus:outline-none resize-none font-mono text-xs"
              placeholder="You are a helpful assistant..."
            />
          </div>
        </div>
      )}

      {/* --- TRIGGER NODE SETTINGS --- */}
      {selectedNode.type === 'trigger' && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-2">
          {subType === 'email' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Email Provider / Inbox</label>
                <select 
                  value={config.emailProvider || 'gmail'}
                  onChange={(e) => updateConfig('emailProvider', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="gmail">Google Workspace (OAuth)</option>
                  <option value="outlook">Microsoft Outlook (OAuth)</option>
                  <option value="imap">Custom IMAP</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Polling Frequency</label>
                <select 
                  value={config.pollingFrequency || '5m'}
                  onChange={(e) => updateConfig('pollingFrequency', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="1m">Every 1 minute</option>
                  <option value="5m">Every 5 minutes</option>
                  <option value="15m">Every 15 minutes</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Filter Rules (JQL)</label>
                <input 
                  type="text" 
                  value={config.filterRules || ''}
                  onChange={(e) => updateConfig('filterRules', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                  placeholder="e.g. subject contains 'Invoice'"
                />
              </div>
            </>
          ) : subType === 'manual' ? (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-sm rounded-md border border-blue-100 dark:border-blue-800">
              This workflow will only run when manually triggered via the UI or API.
            </div>
          ) : (
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
          )}
        </div>
      )}

      {/* --- TOOL NODE SETTINGS --- */}
      {selectedNode.type === 'tool' && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-2">
          {subType === 'email' ? (
            <>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Recipient (To)</label>
                <input 
                  type="text" 
                  value={config.recipient || ''}
                  onChange={(e) => updateConfig('recipient', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono text-xs"
                  placeholder="{{trigger.sender}}"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Subject</label>
                <input 
                  type="text" 
                  value={config.subject || ''}
                  onChange={(e) => updateConfig('subject', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Re: {{trigger.subject}}"
                />
              </div>
              
              {/* SAFETY TOGGLES */}
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-md space-y-3">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                  Safety Safeguards
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-900 dark:text-amber-200">Draft-First Mode</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.draftMode !== false} onChange={(e) => updateConfig('draftMode', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                  </label>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-amber-900 dark:text-amber-200">Loop Prevention</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked={config.loopPrevention !== false} onChange={(e) => updateConfig('loopPrevention', e.target.checked)} className="sr-only peer" />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                  </label>
                </div>
              </div>
            </>
          ) : subType === 'wait' ? (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Wait Duration</label>
              <input 
                type="text" 
                value={config.duration || '1h'}
                onChange={(e) => updateConfig('duration', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. 5m, 1h, 2d"
              />
            </div>
          ) : (
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Integration Action</label>
              <input 
                type="text" 
                value={config.action || ''}
                onChange={(e) => updateConfig('action', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-zinc-700 rounded-md text-sm bg-white dark:bg-zinc-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                placeholder="e.g. POST /api/v1/users"
              />
            </div>
          )}
        </div>
      )}

      {/* --- LOGIC NODE SETTINGS --- */}
      {selectedNode.type === 'logic' && (
        <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-zinc-800 mt-2">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">Routing Condition</label>
            <textarea 
              value={config.condition || ''}
              onChange={(e) => updateConfig('condition', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-purple-300 dark:border-purple-700/50 rounded-md text-sm bg-purple-50/50 dark:bg-purple-900/10 focus:ring-2 focus:ring-purple-500 focus:outline-none resize-none font-mono text-xs"
              placeholder="e.g. {{agent.confidence}} > 0.8"
            />
          </div>
          <div className="text-xs text-gray-500">
            If the condition evaluates to true, the workflow follows the primary branch. Otherwise, it follows the fallback/else branch. Non-matching paths are SKIPPED.
          </div>
        </div>
      )}
    </div>
  );
}
