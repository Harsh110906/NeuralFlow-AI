import { AgentListClient } from '@/components/agents/AgentListClient';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

const currentWorkspaceId = 'dummy-workspace-id';

export default async function AgentsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const workspaceId = currentWorkspaceId;
  
  if (!workspaceId) {
    return (
      <div className="p-8 text-white max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Agent Studio</h1>
        <p className="text-zinc-400">Please select a workspace to configure agents.</p>
      </div>
    );
  }

  return (
    <div className="p-8 text-white max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Agent Studio</h1>
      <p className="text-zinc-400">Configure LLM agents, assign tools, and define system prompts.</p>
      
      <AgentListClient workspaceId={workspaceId} />
    </div>
  );
}
