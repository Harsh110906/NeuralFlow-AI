'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getAgentReleases, promoteAgentVersion, rollbackAgentVersion, AgentRelease } from '@/lib/api/agents';
import { getAgent } from '@/lib/api/agents';
import { ArrowLeft, Rocket, AlertTriangle, RefreshCcw, History } from 'lucide-react';
import Link from 'next/link';

import { use } from 'react';
export default function AgentReleasesPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [releases, setReleases] = useState<AgentRelease[]>([]);
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targetVersion, setTargetVersion] = useState('');
  const [targetEnv, setTargetEnv] = useState('STAGING');
  const [bypassEval, setBypassEval] = useState(false);

  const { getToken } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        
        const [agentRes, releasesRes] = await Promise.all([
          getAgent(params.id, token),
          getAgentReleases(params.id, token)
        ]);
        
        setAgentName(agentRes.name);
        setReleases(releasesRes);
      } catch (e: any) {
        setError(e.message || 'Failed to load releases');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, getToken]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetVersion || !targetEnv) return;
    try {
      const token = await getToken();
      await promoteAgentVersion(params.id, targetVersion, targetEnv, bypassEval, token);
      
      // Reload
      const updated = await getAgentReleases(params.id, token);
      setReleases(updated);
      alert('Promotion successful!');
    } catch (e: any) {
      alert(`Promotion failed: ${e.message}`);
    }
  };

  const handleRollback = async (env: string, verId: string) => {
    if (!confirm(`Are you sure you want to rollback ${env} to version ${verId}?`)) return;
    try {
      const token = await getToken();
      await rollbackAgentVersion(params.id, verId, env, token);
      
      const updated = await getAgentReleases(params.id, token);
      setReleases(updated);
      alert('Rollback successful!');
    } catch (e: any) {
      alert(`Rollback failed: ${e.message}`);
    }
  };

  const activeReleases = releases.reduce((acc, r) => {
    acc[r.environment] = r;
    return acc;
  }, {} as Record<string, AgentRelease>);

  if (loading) return <div className="p-8 text-white">Loading releases...</div>;
  if (error) return <div className="p-8 text-red-400">{error}</div>;

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div>
        <Link href={`/agents/${params.id}`} className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Agent Studio
        </Link>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Rocket className="w-8 h-8 text-purple-400" />
          Release Management: {agentName}
        </h1>
        <p className="text-zinc-400 mt-2">Manage versions, promote across environments, and handle safe rollbacks.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {['DEV', 'STAGING', 'PROD'].map(env => {
          const release = activeReleases[env];
          return (
            <div key={env} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className={`text-xs font-bold px-2 py-1 rounded ${
                  env === 'PROD' ? 'bg-red-900/50 text-red-400' :
                  env === 'STAGING' ? 'bg-blue-900/50 text-blue-400' :
                  'bg-emerald-900/50 text-emerald-400'
                }`}>
                  {env}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mb-4">Active Version</h2>
              {release ? (
                <div>
                  <div className="text-sm font-mono text-zinc-300 bg-black p-3 rounded-lg border border-zinc-800 mb-2">
                    {release.versionId}
                  </div>
                  <div className="text-xs text-zinc-500">
                    Promoted by: {release.promotedBy}<br/>
                    Date: {new Date(release.createdAt).toLocaleString()}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-zinc-500 italic">No active release in this environment.</div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <RefreshCcw className="w-5 h-5 text-emerald-400" /> Promote Version
          </h2>
          <form onSubmit={handlePromote} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Target Version ID</label>
              <input 
                type="text" 
                required
                value={targetVersion}
                onChange={e => setTargetVersion(e.target.value)}
                placeholder="e.g. 123e4567-e89b..."
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-400 mb-1">Target Environment</label>
              <select 
                value={targetEnv}
                onChange={e => setTargetEnv(e.target.value)}
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
              >
                <option value="DEV">DEV</option>
                <option value="STAGING">STAGING</option>
                <option value="PROD">PROD</option>
              </select>
            </div>
            {targetEnv === 'PROD' && (
              <div className="bg-red-900/20 border border-red-500/30 p-3 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-200">
                  <strong>PROD Promotion Guardrail</strong>
                  <p className="mt-1">By default, PROD promotion requires a passed Evaluation Run (80%+). Check the box below to override.</p>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer">
                    <input type="checkbox" checked={bypassEval} onChange={e => setBypassEval(e.target.checked)} className="rounded bg-black border-red-500" />
                    Bypass Evaluation Guardrails
                  </label>
                </div>
              </div>
            )}
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-lg">
              Promote to {targetEnv}
            </button>
          </form>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" /> Rollback
          </h2>
          <p className="text-sm text-zinc-400 mb-4">
            Rollback appends a new promotion pointing to an older version, preserving your immutable audit log.
          </p>
          <div className="space-y-3">
            {releases.map(r => (
              <div key={r.id} className="flex items-center justify-between bg-black p-3 rounded-lg border border-zinc-800">
                <div>
                  <div className="text-sm font-bold text-white">{r.environment}</div>
                  <div className="text-xs text-zinc-500 font-mono">{r.versionId}</div>
                </div>
                <button 
                  onClick={() => handleRollback(r.environment, r.versionId)}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded"
                >
                  Rollback to Here
                </button>
              </div>
            ))}
            {releases.length === 0 && (
              <div className="text-sm text-zinc-500 italic">No history available for rollback.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
