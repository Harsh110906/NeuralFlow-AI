'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import { createConnector, updateConnector, setConnectorSecret, publishConnector, testSandbox } from '@/lib/api/connectors';

export function ConnectorBuilderClient({ workspaceId, initialData }: { workspaceId: string, initialData: any }) {
  const router = useRouter();
  const { getToken } = useAuth();
  
  const [activeTab, setActiveTab] = useState('metadata');
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    description: initialData?.description || '',
    authType: initialData?.authType || 'NONE',
    manifestStr: initialData?.manifest ? JSON.stringify(initialData.manifest, null, 2) : '{\n  "endpoints": []\n}'
  });

  const [secretVal, setSecretVal] = useState('');
  
  // Sandbox State
  const [sandboxReq, setSandboxReq] = useState({
    url: 'https://httpbin.org/get',
    method: 'GET',
    headers: '{}',
    body: '{}'
  });
  const [sandboxRes, setSandboxRes] = useState<any>(null);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      
      let parsedManifest;
      try {
        parsedManifest = JSON.parse(formData.manifestStr);
      } catch (e) {
        alert('Manifest must be valid JSON');
        setSaving(false);
        return;
      }

      let connectorId = initialData?.id;
      
      if (connectorId) {
        await updateConnector(workspaceId, connectorId, {
          name: formData.name,
          description: formData.description,
          authType: formData.authType,
          manifest: parsedManifest
        }, token);
      } else {
        const created = await createConnector(workspaceId, {
          name: formData.name,
          description: formData.description,
          authType: formData.authType,
          manifest: parsedManifest
        }, token);
        connectorId = created.id;
        // Redirect to edit mode
        router.push(`/connectors/${connectorId}/edit`);
      }

      if (secretVal && formData.authType !== 'NONE') {
        // Assume 'apiKey' is the internal keyName we use
        await setConnectorSecret(workspaceId, connectorId, 'apiKey', secretVal, token);
        setSecretVal(''); // clear it
        alert('Connector saved and secret bound successfully!');
      } else {
        alert('Connector saved successfully!');
      }
      
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!initialData?.id) return;
    try {
      const token = await getToken();
      await publishConnector(workspaceId, initialData.id, token);
      alert('Connector published to Workspace!');
      router.refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const runSandbox = async () => {
    if (!initialData?.id) {
      alert('Save connector first before testing');
      return;
    }
    setSandboxRes({ loading: true });
    try {
      const token = await getToken();
      const res = await testSandbox(workspaceId, initialData.id, {
        url: sandboxReq.url,
        method: sandboxReq.method,
        headers: JSON.parse(sandboxReq.headers || '{}'),
        body: JSON.parse(sandboxReq.body || '{}')
      }, token);
      setSandboxRes(res);
    } catch (e: any) {
      setSandboxRes({ error: e.message });
    }
  };

  const isPublished = initialData?.status === 'PUBLISHED';

  return (
    <div className="flex w-full h-full">
      {/* Editor Left Pane */}
      <div className="flex-1 flex flex-col border-r border-gray-200">
        <div className="flex border-b border-gray-200 bg-gray-50">
          <button onClick={() => setActiveTab('metadata')} className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'metadata' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Metadata</button>
          <button onClick={() => setActiveTab('auth')} className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'auth' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Authentication</button>
          <button onClick={() => setActiveTab('manifest')} className={`px-4 py-3 text-sm font-medium border-b-2 ${activeTab === 'manifest' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500'}`}>Manifest</button>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'metadata' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Connector Name</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500" 
                  disabled={isPublished}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full p-2 border rounded h-24 focus:ring-2 focus:ring-blue-500"
                  disabled={isPublished}
                />
              </div>
            </div>
          )}

          {activeTab === 'auth' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authentication Type</label>
                <select 
                  value={formData.authType}
                  onChange={e => setFormData({ ...formData, authType: e.target.value })}
                  className="w-full p-2 border rounded"
                  disabled={isPublished}
                >
                  <option value="NONE">None</option>
                  <option value="API_KEY">API Key / Bearer Token</option>
                  <option value="BASIC">Basic Auth</option>
                </select>
              </div>
              
              {formData.authType !== 'NONE' && (
                <div className="p-4 bg-yellow-50 rounded border border-yellow-200">
                  <label className="block text-sm font-medium text-yellow-800 mb-2">Bind Secret Value</label>
                  <p className="text-xs text-yellow-700 mb-3">This secret is encrypted at rest and never returned to the frontend. It will be injected directly into Outbound Requests.</p>
                  <input 
                    type="password" 
                    placeholder="Enter Secret/Token (Write Only)"
                    value={secretVal}
                    onChange={e => setSecretVal(e.target.value)}
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-500"
                  />
                </div>
              )}
            </div>
          )}

          {activeTab === 'manifest' && (
            <div className="h-full flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-2">API Manifest (JSON)</label>
              <textarea 
                value={formData.manifestStr} 
                onChange={e => setFormData({ ...formData, manifestStr: e.target.value })}
                className="w-full flex-1 p-4 border rounded font-mono text-sm bg-gray-50 focus:bg-white"
                spellCheck={false}
                disabled={isPublished}
              />
            </div>
          )}
        </div>

        <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isPublished && "Cannot edit a published connector. Please version bump."}
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleSave} 
              disabled={saving || isPublished}
              className="bg-gray-800 text-white px-4 py-2 rounded font-medium disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            {initialData && !isPublished && (
              <button 
                onClick={handlePublish}
                className="bg-blue-600 text-white px-4 py-2 rounded font-medium"
              >
                Publish Version
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Sandbox Right Pane */}
      <div className="w-96 flex flex-col bg-gray-50">
        <div className="p-4 border-b border-gray-200 bg-white">
          <h2 className="font-semibold text-gray-800">Sandbox</h2>
          <p className="text-xs text-gray-500 mt-1">Safely execute requests against this API. Secrets will be automatically injected.</p>
        </div>

        <div className="p-4 flex-1 overflow-y-auto space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Method</label>
            <select 
              value={sandboxReq.method}
              onChange={e => setSandboxReq({...sandboxReq, method: e.target.value})}
              className="w-full p-1.5 text-sm border rounded"
            >
              <option>GET</option><option>POST</option><option>PUT</option><option>DELETE</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">URL</label>
            <input 
              value={sandboxReq.url}
              onChange={e => setSandboxReq({...sandboxReq, url: e.target.value})}
              className="w-full p-1.5 text-sm border rounded font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Headers (JSON)</label>
            <textarea 
              value={sandboxReq.headers}
              onChange={e => setSandboxReq({...sandboxReq, headers: e.target.value})}
              className="w-full p-1.5 text-sm border rounded font-mono h-16"
            />
          </div>
          {(sandboxReq.method === 'POST' || sandboxReq.method === 'PUT') && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Body (JSON)</label>
              <textarea 
                value={sandboxReq.body}
                onChange={e => setSandboxReq({...sandboxReq, body: e.target.value})}
                className="w-full p-1.5 text-sm border rounded font-mono h-24"
              />
            </div>
          )}

          <button 
            onClick={runSandbox}
            className="w-full bg-indigo-600 text-white py-2 rounded font-medium mt-4 text-sm"
          >
            Run Request
          </button>

          {sandboxRes && (
            <div className="mt-6">
              <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Response</h3>
              {sandboxRes.loading ? (
                <div className="text-sm text-gray-500">Executing...</div>
              ) : sandboxRes.error ? (
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                  {sandboxRes.error}
                </div>
              ) : (
                <div className="text-xs bg-gray-900 text-green-400 p-3 rounded font-mono overflow-x-auto">
                  <div className="text-white mb-2 pb-2 border-b border-gray-700">
                    HTTP {sandboxRes.status} {sandboxRes.statusText}
                    {sandboxRes.truncated && <span className="ml-2 text-yellow-400 border border-yellow-400 px-1 rounded">TRUNCATED</span>}
                  </div>
                  <pre>{JSON.stringify(sandboxRes.body, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
