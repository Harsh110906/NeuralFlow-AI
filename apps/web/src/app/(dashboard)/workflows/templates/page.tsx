import React from 'react';
import { getTemplates } from '@/lib/api/templates';
import { TemplateListClient } from '@/components/workflows/templates/TemplateListClient';
import { auth } from '@clerk/nextjs/server';
import { getBootstrapWorkspaceId } from '@/lib/api/workspaces';

export default async function TemplatesPage() {
  let templates: any[] = [];
  let error = null;
  let currentWorkspaceId = '';

  try {
    const { getToken } = await auth();
    const token = await getToken();
    const workspaceId = await getBootstrapWorkspaceId(token);
    currentWorkspaceId = workspaceId || '';
    
    // We can fetch public templates globally (or for this workspace)
    templates = await getTemplates(token, undefined, true);
  } catch (err: any) {
    error = err.message || 'Failed to load templates.';
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-black dark:text-white">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Workflow Templates</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Deploy production-ready agentic workflows in one click. 
          Templates come pre-configured with the required tools, logic, and AI models.
        </p>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Error loading templates</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : (
        <TemplateListClient templates={templates} workspaceId={currentWorkspaceId} />
      )}
    </div>
  );
}
