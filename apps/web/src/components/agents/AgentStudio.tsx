'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { updateAgent, chatWithAgent, getAgentReleases, promoteAgentVersion, AgentRelease } from '@/lib/api/agents';
import { Bot, Save, Play, Settings, Shield, Plus, X, Thermometer, Rocket, History, CheckCircle2 } from 'lucide-react';

export function AgentStudio({ agentId, initialData }: { agentId: string, initialData?: any }) {
  const { getToken } = useAuth();
  
  const [name, setName] = useState(initialData?.name || '');
  const [systemPrompt, setSystemPrompt] = useState(initialData?.systemPrompt || '');
  const [model, setModel] = useState(initialData?.model || 'gpt-4o-mini');
  const [temperature, setTemperature] = useState(initialData?.temperature ?? 0.7);
  const [tools, setTools] = useState<string[]>(initialData?.tools || []);
  
  const [newTool, setNewTool] = useState('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const [chatMessages, setChatMessages] = useState<{role: string, content: string}[]>([
    { role: 'assistant', content: 'Hello! I am your configured agent. Test my responses here. Note: Tool executions are currently simulated in this beta playground.' }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');

  const [activeTab, setActiveTab] = useState<'config'|'releases'>('config');
  const [releases, setReleases] = useState<AgentRelease[]>([]);
  const [isPromoting, setIsPromoting] = useState(false);

  // Fetch releases
  const fetchReleases = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getAgentReleases(agentId, token);
      setReleases(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Call when switching to releases tab
  const handleTabSwitch = (tab: 'config'|'releases') => {
    setActiveTab(tab);
    if (tab === 'releases') fetchReleases();
  };

  const handlePromote = async (versionId: string, environment: string, bypassEval: boolean = false) => {
    if (!versionId) return alert('Select a version to promote');
    setIsPromoting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await promoteAgentVersion(agentId, versionId, environment, bypassEval, token);
      await fetchReleases();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to promote version: ${err.message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleRollback = async (versionId: string, environment: string) => {
    if (!confirm(`Are you sure you want to rollback ${environment} to version ${versionId}?`)) return;
    setIsPromoting(true);
    try {
      const token = await getToken();
      if (!token) return;
      // We need to add rollbackAgentVersion to imports
      const { rollbackAgentVersion } = await import('@/lib/api/agents');
      await rollbackAgentVersion(agentId, versionId, environment, token);
      await fetchReleases();
      alert('Rollback successful!');
    } catch (err: any) {
      console.error(err);
      alert(`Rollback failed: ${err.message}`);
    } finally {
      setIsPromoting(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateAgent(agentId, { name, systemPrompt, model, temperature, tools }, token);
      alert('Agent saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save agent.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTool = () => {
    if (newTool.trim() && !tools.includes(newTool.trim())) {
      setTools([...tools, newTool.trim()]);
      setNewTool('');
    }
  };

  const handleRemoveTool = (t: string) => {
    setTools(tools.filter(tool => tool !== t));
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim() || isSending) return;
    const msg = currentMessage;
    setChatMessages(prev => [...prev, { role: 'user', content: msg }]);
    setCurrentMessage('');
    setIsSending(true);
    
    try {
      const token = await getToken();
      const result = await chatWithAgent(agentId, msg, token);
      setChatMessages(prev => [...prev, { role: 'assistant', content: result.content }]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: Failed to get a response from the agent.' }]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 overflow-hidden">
      {/* Left Panel */}
      <div className="w-1/2 flex flex-col bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800">
        
        {/* Tab Navigation */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 px-6 pt-4 bg-zinc-50 dark:bg-zinc-900/50">
          <button 
            onClick={() => handleTabSwitch('config')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'config' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Configuration
          </button>
          <button 
            onClick={() => handleTabSwitch('releases')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'releases' 
                ? 'border-blue-500 text-blue-600 dark:text-blue-400' 
                : 'border-transparent text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
            }`}
          >
            Releases <Rocket className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeTab === 'config' ? (
          <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-500" />
                <h2 className="text-2xl font-bold">Agent Configuration</h2>
              </div>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Agent'}
              </button>
            </div>
            
            <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-zinc-400">Agent Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" 
              placeholder="e.g. Support Bot"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-sm text-zinc-400">LLM Model</label>
              <select 
                value={model} 
                onChange={(e) => setModel(e.target.value)} 
                className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              >
                <option value="gpt-4o-mini">GPT-4o Mini</option>
                <option value="gpt-4o">GPT-4o</option>
                <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-sm text-zinc-400 flex items-center justify-between">
                <span>Temperature</span>
                <span className="text-xs font-mono">{temperature}</span>
              </label>
              <div className="flex items-center gap-3 p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                <Thermometer className="w-4 h-4 text-zinc-500" />
                <input 
                  type="range" 
                  min="0" max="2" step="0.1" 
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="flex-1 accent-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-semibold text-sm text-zinc-400">System Prompt</label>
            <textarea 
              value={systemPrompt} 
              onChange={(e) => setSystemPrompt(e.target.value)} 
              className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all resize-none min-h-[200px]" 
              placeholder="You are a helpful assistant..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-sm text-zinc-400 flex items-center gap-1.5">
                <Shield className="w-4 h-4" /> Tool Capabilities
              </label>
              <span className="text-xs text-zinc-500 bg-zinc-800/50 px-2 py-1 rounded">Beta Capability Metadata</span>
            </div>
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <p className="text-xs text-zinc-500 mb-3">
                Explicitly assign connector operations to this agent. By default, agents have least-privilege (no implicit access). Backend enforcement is the source of truth.
              </p>
              
              <div className="flex gap-2 mb-3">
                <input 
                  type="text"
                  value={newTool}
                  onChange={(e) => setNewTool(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTool()}
                  placeholder="e.g. slack:sendMessage"
                  className="flex-1 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button onClick={handleAddTool} className="p-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {tools.length === 0 ? (
                  <span className="text-sm text-zinc-500 italic">No tools assigned.</span>
                ) : (
                  tools.map((t, i) => (
                    <div key={i} className="flex items-center gap-1.5 bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-full text-sm font-mono border border-blue-500/20">
                      {t}
                      <button onClick={() => handleRemoveTool(t)} className="hover:text-red-400 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          </div>
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-purple-500" />
                <h2 className="text-2xl font-bold">Release Management</h2>
              </div>
            </div>
            
            <p className="text-sm text-zinc-500">
              Promote agent versions to environments. When clients request an execution in an environment, the specified version is used.
            </p>

            <div className="space-y-6 mt-4">
              {['STAGING', 'PRODUCTION'].map(env => {
                const release = releases.find(r => r.environment === env);
                return (
                  <div key={env} className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-zinc-50 dark:bg-zinc-900/30">
                    <div className="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {env === 'PRODUCTION' ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <History className="w-4 h-4 text-orange-500" />}
                        <h3 className="font-bold text-sm tracking-wide">{env}</h3>
                      </div>
                      {release && (
                        <span className="text-xs text-zinc-500">
                          Promoted by {release.promotedBy} on {new Date(release.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="p-5 flex justify-between items-center">
                      <div>
                        {release ? (
                          <div className="flex flex-col gap-1">
                            <span className="text-lg font-bold">Version {release.version?.version}</span>
                            <span className="text-xs text-zinc-500 font-mono">{release.version?.model} • Temp: {release.version?.temperature}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-zinc-500 italic">No release active</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                           <select 
                             id={`select-${env}`}
                             className="p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded focus:outline-none text-sm"
                             defaultValue=""
                           >
                             <option value="" disabled>Select version...</option>
                             {initialData?.versions?.map((v: any) => (
                               <option key={v.id} value={v.id}>v{v.version}</option>
                             ))}
                           </select>
                           <button 
                             disabled={isPromoting}
                             onClick={() => {
                               const el = document.getElementById(`select-${env}`) as HTMLSelectElement;
                               const bypassEl = document.getElementById(`bypass-${env}`) as HTMLInputElement;
                               handlePromote(el.value, env, bypassEl?.checked || false);
                             }}
                             className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded transition-colors disabled:opacity-50"
                           >
                             Promote
                           </button>
                        </div>
                        {env === 'PRODUCTION' && (
                          <label className="flex items-center gap-2 text-xs text-zinc-400 mt-1 cursor-pointer">
                            <input type="checkbox" id={`bypass-${env}`} className="rounded bg-black border-zinc-700" />
                            Bypass Eval Guardrails
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 border-t border-zinc-200 dark:border-zinc-800 pt-6">
              <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-zinc-300">
                <History className="w-5 h-5" /> Rollback History
              </h3>
              <p className="text-xs text-zinc-500 mb-4">Rollback preserves the audit log by creating a new promotion pointing to a previous version.</p>
              <div className="space-y-3">
                {releases.map(r => (
                  <div key={r.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <div>
                      <div className="text-sm font-bold">{r.environment}</div>
                      <div className="text-xs text-zinc-500 font-mono">Version ID: {r.versionId}</div>
                    </div>
                    <button 
                      onClick={() => handleRollback(r.versionId, r.environment)}
                      disabled={isPromoting}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded transition-colors disabled:opacity-50"
                    >
                      Rollback to Here
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Playground Panel */}
      <div className="w-1/2 flex flex-col bg-zinc-50 dark:bg-zinc-950 relative">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-green-500" />
            <h2 className="text-lg font-bold">Playground Chat</h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs px-2 py-1 rounded bg-yellow-500/10 text-yellow-500 font-medium border border-yellow-500/20">
              Ephemeral Session
            </span>
            <span className="text-xs px-2 py-1 rounded bg-purple-500/10 text-purple-400 font-medium border border-purple-500/20">
              Simulated Tools
            </span>
          </div>
        </div>
        
        <div className="flex-1 p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar">
          {chatMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[85%] p-4 rounded-2xl shadow-sm text-sm leading-relaxed
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-br-sm' 
                  : 'bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-bl-sm'}
              `}>
                {msg.role === 'assistant' && i === 0 && (
                   <div className="flex items-center gap-2 mb-2 text-blue-500">
                     <Bot className="w-4 h-4" />
                     <span className="font-semibold">{name || 'Agent'}</span>
                   </div>
                )}
                {msg.content}
              </div>
            </div>
          ))}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-2xl rounded-bl-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex gap-2">
            <input 
              type="text" 
              value={currentMessage}
              onChange={(e) => setCurrentMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isSending}
              className="flex-1 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50"
              placeholder="Type a message to test your agent..."
            />
            <button 
              onClick={handleSendMessage}
              disabled={isSending || !currentMessage.trim()}
              className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 text-white rounded-xl hover:opacity-90 font-medium disabled:opacity-50 transition-opacity"
            >
              Send
            </button>
          </div>
          <p className="text-center text-xs text-zinc-500 mt-3">
            No persistent chat history or memory is stored in this phase.
          </p>
        </div>
      </div>
    </div>
  );
}
