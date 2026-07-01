import { AgentStudio } from '@/components/agents/AgentStudio';

export default async function AgentPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  // Mock fetch from backend
  const res = await fetch(`http://localhost:3001/agents/${params.id}`, { cache: 'no-store' }).catch(() => null);
  const agent = res?.ok ? await res.json() : null;

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
