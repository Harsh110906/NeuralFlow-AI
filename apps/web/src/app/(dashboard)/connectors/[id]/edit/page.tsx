import React from 'react';
import { getConnector } from '@/lib/api/connectors';
import { auth } from '@clerk/nextjs/server';
import { ConnectorBuilderClient } from '@/components/connectors/connector-builder-client';

const currentWorkspaceId = 'dummy-workspace-id';

export default async function ConnectorEditPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  let connector = null;

  if (params.id !== 'new') {
    try {
      const { getToken } = await auth();
      const token = await getToken();
      connector = await getConnector(currentWorkspaceId, params.id, token);
    } catch (err) {
      console.error(err);
      return <div className="p-8 text-red-500">Failed to load connector.</div>;
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold">
          {connector ? `Edit Connector: ${connector.name}` : 'New Custom Connector'}
        </h1>
        {connector && (
          <span className={`px-2.5 py-0.5 rounded text-xs font-semibold ${
            connector.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
          }`}>
            {connector.status}
          </span>
        )}
      </div>

      <div className="flex-1 bg-white border rounded-lg shadow-sm overflow-hidden flex flex-col md:flex-row">
        <ConnectorBuilderClient 
          workspaceId={currentWorkspaceId} 
          initialData={connector} 
        />
      </div>
    </div>
  );
}
