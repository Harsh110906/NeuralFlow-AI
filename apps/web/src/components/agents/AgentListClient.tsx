'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getAgents, createAgent, deleteAgent, Agent } from '@/lib/api/agents';
import { useRouter } from 'next/navigation';
import { Bot, Plus, Trash2, Clock } from 'lucide-react';

export function AgentListClient({ workspaceId }: { workspaceId: string }) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const token = await getToken();
      const data = await getAgents(workspaceId, token);
      setAgents(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadAgents();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId]);

  const handleCreateAgent = async () => {
    const name = window.prompt('Enter new agent name:');
    if (!name) return;
    try {
      const token = await getToken();
      const newAgent = await createAgent(workspaceId, {
        name,
        systemPrompt: 'You are a helpful assistant.',
        model: 'gpt-4o-mini',
        tools: []
      }, token);
      router.push(`/agents/${newAgent.id}`);
    } catch (err: any) {
      alert(err.message || 'Failed to create agent');
    }
  };

  const handleDeleteAgent = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the agent "${name}"?`)) return;
    try {
      const token = await getToken();
      await deleteAgent(id, token);
      loadAgents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete agent');
    }
  };

  if (loading) {
    return <div className="text-zinc-500 mt-8">Loading agents...</div>;
  }

  if (error) {
    return <div className="text-red-500 mt-8">Error: {error}</div>;
  }

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-white flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-500" />
          Active Agents
        </h2>
        <button
          onClick={handleCreateAgent}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Agent
        </button>
      </div>

      {agents.length === 0 ? (
        <div className="border border-dashed border-zinc-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="bg-zinc-900 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Bot className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-white font-medium text-lg mb-2">No agents configured</h3>
          <p className="text-zinc-400 max-w-md mx-auto mb-6">
            Create an agent to give your workflows autonomous reasoning capabilities. 
            Assign tools and provide detailed system prompts.
          </p>
          <button
            onClick={handleCreateAgent}
            className="bg-zinc-100 hover:bg-white text-zinc-900 px-6 py-2 rounded-lg font-medium transition-colors"
          >
            Create Your First Agent
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div 
              key={agent.id}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-blue-500/50 transition-colors cursor-pointer group flex flex-col relative"
              onClick={() => router.push(`/agents/${agent.id}`)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-500/10 p-2 rounded-lg text-blue-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-lg leading-tight">{agent.name}</h3>
                    <p className="text-zinc-500 text-xs mt-1 font-mono">{agent.model}</p>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteAgent(agent.id, agent.name);
                  }}
                  className="text-zinc-600 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <p className="text-zinc-400 text-sm line-clamp-2 mb-6 flex-1">
                {agent.systemPrompt || 'No system prompt configured.'}
              </p>

              <div className="flex items-center justify-between pt-4 border-t border-zinc-800 text-xs text-zinc-500">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(agent.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="px-2 py-1 bg-zinc-800/50 rounded text-zinc-400 font-mono">
                  {agent.tools?.length || 0} tools
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
