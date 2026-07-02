import { AgentStudio } from '@/components/agents/AgentStudio';
import { auth } from '@clerk/nextjs/server';
import { getAgent } from '@/lib/api/agents';

export default async function AgentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const { getToken } = await auth();
  const token = await getToken();
  
  let agent = null;
  try {
    agent = await getAgent(params.id, token);
  } catch (err) {
    console.error('Failed to fetch agent:', err);
  }

  if (!agent && params.id !== 'new') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Agent Not Found</h1>
        <p>Make sure the backend is running and the agent exists.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-hidden h-[calc(100vh-4rem)]">
      <AgentStudio agentId={params.id} initialData={agent} />
    </div>
  );
}
