import React from 'react';
import { getConnectors } from '@/lib/api/connectors';
import { auth } from '@clerk/nextjs/server';
import Link from 'next/link';

const currentWorkspaceId = 'dummy-workspace-id';

export default async function ConnectorsPage() {
  let connectors: any[] = [];
  let error = null;

  try {
    const { getToken } = await auth();
    const token = await getToken();
    connectors = await getConnectors(currentWorkspaceId, token);
  } catch (err: any) {
    error = err.message || 'Failed to load connectors';
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Custom Connectors</h1>
          <p className="text-gray-500">
            Define custom API integrations for use in your Agents and Workflows.
          </p>
        </div>
        <Link 
          href="/connectors/new/edit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700"
        >
          New Connector
        </Link>
      </div>

      {error ? (
        <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6">{error}</div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-sm text-gray-500">
                <th className="py-3 px-6 font-medium">Name</th>
                <th className="py-3 px-6 font-medium">Auth Type</th>
                <th className="py-3 px-6 font-medium">Status</th>
                <th className="py-3 px-6 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {connectors.map(conn => (
                <tr key={conn.id} className="border-b hover:bg-gray-50/50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{conn.name}</div>
                    <div className="text-sm text-gray-500">{conn.description}</div>
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-600">{conn.authType}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      conn.status === 'PUBLISHED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {conn.status} v{conn.version}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <Link href={`/connectors/${conn.id}/edit`} className="text-blue-600 hover:underline text-sm font-medium">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {connectors.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-gray-500">
                    No custom connectors configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
