import React from 'react';
import Link from 'next/link';
import { getWorkflows } from '@/lib/api/workflows';
import { auth } from '@clerk/nextjs/server';

const currentWorkspaceId = 'dummy-workspace-id';

export default async function WorkflowsPage() {
  let workflows: any[] = [];
  let error = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    workflows = await getWorkflows(currentWorkspaceId, token);
  } catch (err: any) {
    error = err.message || 'Failed to load workflows.';
  }

  return (
    <div className="p-8 max-w-7xl mx-auto text-black dark:text-white">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Workflows</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your autonomous workflow graphs.</p>
        </div>
        <Link 
          href="/workflows/templates" 
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Workflow
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded mb-6">
          <p className="font-medium">Error loading workflows</p>
          <p className="text-sm">{error}</p>
        </div>
      ) : workflows.length === 0 ? (
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">No workflows yet</h2>
          <p className="text-gray-500 mb-6 max-w-md">
            Get started by creating a blank canvas or exploring our pre-built templates for support, sales, and more.
          </p>
          <Link 
            href="/workflows/templates" 
            className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-semibold rounded-lg hover:opacity-90 transition-opacity"
          >
            Browse Templates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow: any) => (
            <Link 
              key={workflow.id} 
              href={`/workflows/${workflow.id}`}
              className="block border border-gray-200 dark:border-gray-800 bg-white dark:bg-zinc-950 rounded-xl p-6 hover:shadow-md transition-shadow group"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg group-hover:text-blue-600 transition-colors">
                  {workflow.name}
                </h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-semibold rounded-full">
                  Saved
                </span>
              </div>
              <p className="text-sm text-gray-500 line-clamp-2 h-10 mb-4">
                {workflow.description || 'No description provided.'}
              </p>
              <div className="text-xs text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-800">
                Last updated: {new Date(workflow.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
