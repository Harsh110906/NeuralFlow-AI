'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createWorkflow } from '@/lib/api/workflows';
import { Template } from '@/lib/api/templates';

export function TemplateListClient({ templates, workspaceId }: { templates: Template[], workspaceId: string }) {
  const router = useRouter();
  const { getToken } = useAuth();
  const [isDeploying, setIsDeploying] = useState<string | null>(null);

  const handleDeployTemplate = async (template: Template) => {
    setIsDeploying(template.id);
    try {
      const token = await getToken();
      const workflow = await createWorkflow({
        workspaceId,
        name: template.name,
        description: template.description,
        templateId: template.id
      }, token || '');
      
      // Navigate directly to the builder
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to provision template.');
      setIsDeploying(null);
    }
  };

  const handleStartFromScratch = async () => {
    setIsDeploying('scratch');
    try {
      const token = await getToken();
      const workflow = await createWorkflow({
        workspaceId,
        name: 'Untitled Workflow',
        description: 'A new workflow built from scratch.',
      }, token || '');
      router.push(`/workflows/${workflow.id}`);
    } catch (error) {
      console.error(error);
      alert('Failed to create empty workflow.');
      setIsDeploying(null);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Create from Scratch Card */}
        <div 
          onClick={() => !isDeploying && handleStartFromScratch()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col justify-center items-center text-center cursor-pointer hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors h-64"
        >
          {isDeploying === 'scratch' ? (
            <span className="animate-pulse font-medium text-gray-500">Creating Workflow...</span>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg mb-1">Start from Scratch</h3>
              <p className="text-sm text-gray-500">Build your own custom agentic DAG on a blank canvas.</p>
            </>
          )}
        </div>

        {/* Template Cards */}
        {templates.map((tpl) => (
          <div key={tpl.id} className="border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 rounded-xl overflow-hidden hover:shadow-lg transition-shadow h-64 flex flex-col">
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-4">
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 text-xs font-semibold rounded-full">
                  {tpl.category}
                </span>
                <span className="text-xs font-medium text-gray-500">
                  Est. Cost: $0.05/run
                </span>
              </div>
              
              <h3 className="font-semibold text-lg mb-2">{tpl.name}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 flex-1 overflow-hidden">
                {tpl.description}
              </p>

              <div className="mt-4 flex space-x-2">
                {tpl.versions?.[0]?.requiredConnectors?.map(c => (
                   <span key={c} className="text-[10px] uppercase font-bold text-gray-500 bg-gray-100 dark:bg-zinc-900 px-2 py-1 rounded">
                     {c}
                   </span>
                ))}
              </div>
            </div>
            
            <div className="border-t border-gray-100 dark:border-gray-900 p-4 bg-gray-50 dark:bg-zinc-900/50">
              <button 
                onClick={() => !isDeploying && handleDeployTemplate(tpl)}
                disabled={isDeploying !== null}
                className="w-full py-2 bg-black text-white dark:bg-white dark:text-black font-semibold rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {isDeploying === tpl.id ? 'Deploying...' : 'Use Template'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
