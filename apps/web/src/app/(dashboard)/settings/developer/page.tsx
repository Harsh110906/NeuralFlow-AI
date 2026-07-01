'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Settings, Key, Webhook, Trash2, Plus, Copy, RefreshCw, Eye, EyeOff } from 'lucide-react';

import { use } from 'react';
export default function DeveloperSettingsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const { getToken } = useAuth();
  // Using a mock workspace ID for now or it would come from context/url
  const workspaceId = 'default-workspace'; 

  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  
  const [newWebhookUrl, setNewWebhookUrl] = useState('');
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    
    const [keysRes, webhooksRes] = await Promise.all([
      fetch(`${API_BASE}/workspaces/${workspaceId}/developer/api-keys`, { headers: { Authorization: `Bearer ${token}` } }),
      fetch(`${API_BASE}/workspaces/${workspaceId}/developer/webhooks`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    
    if (keysRes.ok) setApiKeys(await keysRes.json());
    if (webhooksRes.ok) setWebhooks(await webhooksRes.json());
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createApiKey = async () => {
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/developer/api-keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ scopes: ['api:all'] })
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Store this API Key securely, it will only be shown once: ${data.apiKey}`);
      fetchData();
    }
  };

  const revokeApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key?')) return;
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    await fetch(`${API_BASE}/workspaces/${workspaceId}/developer/api-keys/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  const createWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.startsWith('https://')) return alert('Endpoint must be HTTPS');
    
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/developer/webhooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ endpointUrl: newWebhookUrl, events: ['*'] })
    });
    if (res.ok) {
      const data = await res.json();
      alert(`Webhook created. Your secret is: ${data.secret}. Store it to verify HMAC signatures.`);
      setNewWebhookUrl('');
      fetchData();
    }
  };

  const deleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    await fetch(`${API_BASE}/workspaces/${workspaceId}/developer/webhooks/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    });
    fetchData();
  };

  const loadWebhookLogs = async (id: string) => {
    if (selectedWebhook === id) {
      setSelectedWebhook(null);
      return;
    }
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${API_BASE}/workspaces/${workspaceId}/developer/webhooks/${id}/logs`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      setLogs(await res.json());
      setSelectedWebhook(id);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-blue-400" />
          Developer Platform
        </h1>
        <p className="text-zinc-400 mt-2">Manage API keys and outgoing webhooks for your workspace.</p>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-amber-400" /> API Keys
          </h2>
          <button onClick={createApiKey} className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1">
            <Plus className="w-4 h-4" /> New Key
          </button>
        </div>
        <div className="divide-y divide-zinc-800">
          {apiKeys.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No API keys found.</div>
          ) : apiKeys.map(key => (
            <div key={key.id} className="p-5 flex justify-between items-center">
              <div>
                <div className="font-mono text-sm text-white mb-1">{key.prefix}****************</div>
                <div className="text-xs text-zinc-500">Created: {new Date(key.createdAt).toLocaleString()}</div>
                <div className="text-xs text-zinc-500">Last used: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : 'Never'}</div>
              </div>
              {!key.revokedAt ? (
                <button onClick={() => revokeApiKey(key.id)} className="p-2 text-zinc-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-xs font-bold text-red-500 px-2 py-1 bg-red-950 rounded">REVOKED</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Webhook className="w-5 h-5 text-emerald-400" /> Webhooks
          </h2>
        </div>
        
        <div className="p-5 border-b border-zinc-800 bg-zinc-900/50">
          <form onSubmit={createWebhook} className="flex gap-3">
            <input 
              type="url" 
              required
              value={newWebhookUrl}
              onChange={e => setNewWebhookUrl(e.target.value)}
              placeholder="https://your-api.com/webhooks"
              className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            />
            <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Endpoint
            </button>
          </form>
          <p className="text-xs text-zinc-500 mt-2">Endpoints must use HTTPS. We will sign payloads with HMAC SHA256.</p>
        </div>

        <div className="divide-y divide-zinc-800">
          {webhooks.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">No webhooks configured.</div>
          ) : webhooks.map(wh => (
            <div key={wh.id} className="flex flex-col">
              <div className="p-5 flex justify-between items-center bg-zinc-950 hover:bg-zinc-900 transition-colors cursor-pointer" onClick={() => loadWebhookLogs(wh.id)}>
                <div>
                  <div className="font-mono text-sm text-white mb-1">{wh.endpointUrl}</div>
                  <div className="text-xs text-zinc-500 flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${wh.active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    {wh.active ? 'Active' : 'Inactive'} • Created {new Date(wh.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteWebhook(wh.id); }} className="p-2 text-zinc-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              
              {selectedWebhook === wh.id && (
                <div className="bg-black border-t border-zinc-800 p-5">
                  <h3 className="text-sm font-bold text-white mb-3">Delivery Logs (Last 50)</h3>
                  {logs.length === 0 ? (
                    <div className="text-xs text-zinc-500 italic">No deliveries recorded yet.</div>
                  ) : (
                    <div className="space-y-3">
                      {logs.map(log => (
                        <div key={log.id} className="border border-zinc-800 rounded bg-zinc-900/50 p-3">
                          <div className="flex justify-between items-center mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 text-xs font-bold rounded ${log.success ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                                {log.responseStatus ? `HTTP ${log.responseStatus}` : 'FAILED'}
                              </span>
                              <span className="text-xs text-zinc-400">{log.eventType}</span>
                            </div>
                            <span className="text-xs text-zinc-500">{new Date(log.createdAt).toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-zinc-500 flex gap-4">
                            <span>Attempts: {log.attempts}</span>
                            {log.errorMessage && <span className="text-red-400">{log.errorMessage}</span>}
                            {log.nextRetryAt && <span>Next retry: {new Date(log.nextRetryAt).toLocaleString()}</span>}
                          </div>
                          <details className="mt-2 text-xs">
                            <summary className="text-blue-400 cursor-pointer hover:underline">View Redacted Payload</summary>
                            <pre className="mt-2 p-2 bg-black rounded border border-zinc-800 overflow-x-auto text-zinc-300">
                              {JSON.stringify(log.payloadSnapshot, null, 2)}
                            </pre>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
