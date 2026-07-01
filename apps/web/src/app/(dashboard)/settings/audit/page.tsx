'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { ShieldAlert, Search, Download, Eye, EyeOff, Key } from 'lucide-react';

export default function AuditExplorerPage() {
  const { getToken } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  const fetchLogs = async () => {
    try {
      const token = await getToken();
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      let currentWorkspaceId = workspaceId;
      if (!currentWorkspaceId) {
        const bsRes = await fetch(`${API_BASE}/workspaces/bootstrap`, { headers: { Authorization: `Bearer ${token}` } });
        if (!bsRes.ok) return;
        const ws = await bsRes.json();
        currentWorkspaceId = ws.id;
        setWorkspaceId(ws.id);
      }
      
      const res = await fetch(`${API_BASE}/governance/audit/${currentWorkspaceId}?limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setLogs(await res.json());
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exportCsv = async () => {
    const token = await getToken();
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    window.open(`${API_BASE}/governance/audit/${workspaceId}/export?token=${token}`, '_blank');
  };

  const filteredLogs = logs.filter(l => 
    l.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    l.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.resource.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-blue-400" />
          Audit Log Explorer
        </h1>
        <p className="text-zinc-400 mt-2">Immutable trail of sensitive workspace operations.</p>
      </div>

      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-2.5 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search by action, actor, or resource..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <button onClick={exportCsv} className="px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-white rounded-lg flex items-center gap-2 transition-colors">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading audit trail...</div>
        ) : (
          <table className="w-full text-left text-sm text-zinc-300">
            <thead className="bg-zinc-900/50 text-xs text-zinc-500 uppercase">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Resource</th>
                <th className="px-6 py-4">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-zinc-900/30 transition-colors group">
                  <td className="px-6 py-4 whitespace-nowrap text-zinc-400">{new Date(log.timestamp).toLocaleString()}</td>
                  <td className="px-6 py-4 font-medium text-white">{log.actor}</td>
                  <td className="px-6 py-4">
                    <span className="bg-zinc-800 text-zinc-300 px-2 py-1 rounded text-xs font-mono border border-zinc-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs">{log.resource}</td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {expandedLog === log.id ? 'Hide' : 'View'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {expandedLog && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-yellow-500" /> 
                Detailed Audit Record (Redacted)
              </h3>
              <button onClick={() => setExpandedLog(null)} className="text-zinc-500 hover:text-white">Close</button>
            </div>
            <div className="p-4 overflow-y-auto font-mono text-xs text-emerald-400 bg-black">
              {JSON.stringify(logs.find(l => l.id === expandedLog), null, 2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
