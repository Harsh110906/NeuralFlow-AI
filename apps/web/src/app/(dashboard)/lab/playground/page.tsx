'use client';

import { useState, useEffect } from 'react';
import { useAuth, useSession } from '@clerk/nextjs';
import { getDatasets, createDatasetVersion, runPlayground } from '@/lib/api/evaluation';
import { ArrowLeft, Play, Save } from 'lucide-react';
import Link from 'next/link';

export default function PlaygroundPage() {
  const [inputJson, setInputJson] = useState('{\n  "query": "Hello, how are you?"\n}');
  const [agentId, setAgentId] = useState('');
  const [output, setOutput] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  
  const [curatedInput, setCuratedInput] = useState('');
  const [curatedAssertions, setCuratedAssertions] = useState('[\n  { "type": "CONTAINS", "value": "test" },\n  { "type": "LLM_JUDGE", "value": "HelpfulnessRubric" }\n]');

  const { getToken } = useAuth();
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        
        let currentWorkspaceId = workspaceId;
        if (!currentWorkspaceId) {
          const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const bsRes = await fetch(`${API_BASE}/workspaces/bootstrap`, { headers: { Authorization: `Bearer ${token}` } });
          if (!bsRes.ok) return;
          const ws = await bsRes.json();
          currentWorkspaceId = ws.id;
          setWorkspaceId(ws.id);
        }

        const ds = await getDatasets(currentWorkspaceId!, token);
        setDatasets(ds);
        if (ds.length > 0) setSelectedDatasetId(ds[0].id);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRun = async () => {
    if (!agentId || !inputJson || !workspaceId) return;
    setLoading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await runPlayground(workspaceId, agentId, JSON.parse(inputJson), token);
      setOutput(res);
    } catch (e) {
      console.error(e);
      alert('Failed to run playground. Check input JSON and Agent Version ID.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenSaveModal = () => {
    setCuratedInput(inputJson);
    setShowSaveModal(true);
  };

  const handleSaveToDataset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDatasetId) return;
    try {
      const token = await getToken();
      if (!token) return;

      const newTestCase = {
        input: JSON.parse(curatedInput),
        assertions: JSON.parse(curatedAssertions)
      };

      await createDatasetVersion(selectedDatasetId, "Curated from Playground", [newTestCase], token);
      
      setShowSaveModal(false);
      alert('Saved as new dataset version successfully!');
    } catch (e) {
      console.error(e);
      alert('Failed to save. Check JSON format.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/lab" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Lab
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Manual Playground</h1>
          <p className="text-zinc-400">Run an agent version manually and curate test cases for evaluation.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Agent Version ID</label>
            <input 
              type="text" 
              value={agentId}
              onChange={e => setAgentId(e.target.value)}
              placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
              className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>
          <div className="mb-4">
            <label className="block text-xs font-medium text-zinc-400 mb-1">Input Payload (JSON)</label>
            <textarea 
              value={inputJson}
              onChange={e => setInputJson(e.target.value)}
              className="w-full bg-black font-mono text-sm border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 outline-none focus:border-purple-500 h-64"
            />
          </div>
          <button 
            onClick={handleRun}
            disabled={loading || !agentId}
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> {loading ? 'Running...' : 'Run Agent'}
          </button>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-xs font-medium text-zinc-400">Agent Output</label>
            {output && (
              <button 
                onClick={handleOpenSaveModal}
                className="text-xs bg-emerald-900/50 text-emerald-400 hover:bg-emerald-900 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors border border-emerald-800"
              >
                <Save className="w-3 h-3" /> Save as Test Case
              </button>
            )}
          </div>
          <div className="bg-black border border-zinc-800 rounded-lg p-4 flex-1 overflow-auto">
            {output ? (
              <pre className="text-sm text-zinc-300 font-mono whitespace-pre-wrap">
                {output.output?.text || JSON.stringify(output.output, null, 2)}
              </pre>
            ) : (
              <div className="text-zinc-600 text-sm h-full flex items-center justify-center">
                Run the agent to see output
              </div>
            )}
          </div>
          {output?.latencyMs && (
            <div className="text-xs text-zinc-500 mt-3 text-right">
              Latency: {output.latencyMs}ms
            </div>
          )}
        </div>
      </div>

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveToDataset} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Curate Test Case</h2>
            <p className="text-sm text-zinc-400 mb-4">Review and edit the input and assertions before saving to a dataset version.</p>
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-zinc-400 mb-1">Target Dataset</label>
              <select 
                value={selectedDatasetId}
                onChange={e => setSelectedDatasetId(e.target.value)}
                required
                className="w-full bg-black border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-purple-500"
              >
                <option value="">Select a dataset...</option>
                {datasets.map(d => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Curated Input (JSON)</label>
                <textarea 
                  required
                  value={curatedInput}
                  onChange={e => setCuratedInput(e.target.value)}
                  className="w-full bg-black font-mono text-sm border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 outline-none focus:border-purple-500 h-48"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Curated Assertions (JSON Array)</label>
                <textarea 
                  required
                  value={curatedAssertions}
                  onChange={e => setCuratedAssertions(e.target.value)}
                  className="w-full bg-black font-mono text-sm border border-zinc-800 rounded-lg px-3 py-2 text-emerald-400 outline-none focus:border-purple-500 h-48"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setShowSaveModal(false)}
                className="text-zinc-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={!selectedDatasetId}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
              >
                <Save className="w-4 h-4" /> Save Test Case
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
