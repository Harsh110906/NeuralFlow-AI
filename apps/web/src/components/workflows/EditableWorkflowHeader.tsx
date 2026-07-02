'use client';

import { useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { updateWorkflow } from '@/lib/api/workflows';
import { useRouter } from 'next/navigation';

export function EditableWorkflowHeader({ workflow }: { workflow: any }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(workflow?.name || 'Untitled Workflow');
  const [description, setDescription] = useState(workflow?.description || 'Build your agentic workflow below');
  const [isSaving, setIsSaving] = useState(false);
  const { getToken } = useAuth();
  const router = useRouter();

  const handleSave = async () => {
    if (!workflow?.id) return;
    setIsSaving(true);
    try {
      const token = await getToken();
      await updateWorkflow(workflow.id, { name, description }, token);
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert('Failed to update workflow details.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!workflow) {
    return (
      <div className="border-b border-gray-200 dark:border-gray-800 p-4">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Untitled Workflow</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Build your agentic workflow below</p>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-zinc-950">
      {isEditing ? (
        <div className="flex flex-col gap-2 max-w-2xl">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="text-xl font-bold bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Workflow Name"
            autoFocus
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm bg-gray-50 dark:bg-zinc-900 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-700 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Workflow Description"
          />
          <div className="flex gap-2 mt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-indigo-600 text-white px-3 py-1 text-sm rounded hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setName(workflow.name || 'Untitled Workflow');
                setDescription(workflow.description || 'Build your agentic workflow below');
              }}
              disabled={isSaving}
              className="bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 text-sm rounded hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="group flex flex-col items-start cursor-pointer" onClick={() => setIsEditing(true)}>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h1>
            <svg className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
        </div>
      )}
    </div>
  );
}
