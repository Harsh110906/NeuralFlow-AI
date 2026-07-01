import { WorkflowCanvas } from '@/components/workflows/WorkflowCanvas';

export default async function WorkflowPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  
  let workflow = null;
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/workflows/${params.id}`, { cache: 'no-store' });
    if (res.ok) workflow = await res.json();
  } catch (e) {
    console.error('Fetch failed during build:', e);
  }

  if (!workflow && params.id !== 'new') {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold text-red-500">Workflow Not Found</h1>
        <p>Make sure the backend is running and the workflow exists.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-950">
      <div className="border-b p-4">
        <h1 className="text-xl font-bold">{workflow?.name || 'Untitled Workflow'}</h1>
        <p className="text-sm text-gray-500">{workflow?.description || 'Build your agentic workflow below'}</p>
      </div>
      <div className="flex-1">
        <WorkflowCanvas workflowId={params.id} initialData={workflow?.dagJson} />
      </div>
    </div>
  );
}
