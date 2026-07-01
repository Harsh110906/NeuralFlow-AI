'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getEvaluationRuns, triggerEvaluationRun, EvaluationRun, getDatasets, getDatasetVersions, EvaluationDataset } from '@/lib/api/evaluation';
import { getAgents, Agent } from '@/lib/api/agents';
import { PlayCircle, ShieldCheck, Zap, ArrowRight, BarChart } from 'lucide-react';
import Link from 'next/link';

export default function LabRunsPage() {
  const [runs, setRuns] = useState<EvaluationRun[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  
  // For the modal
  const [agents, setAgents] = useState<Agent[]>([]);
  const [datasets, setDatasets] = useState<EvaluationDataset[]>([]);
  
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedAgentVersionId, setSelectedAgentVersionId] = useState('');
  
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  const [selectedDatasetVersionId, setSelectedDatasetVersionId] = useState('');
  const [datasetVersionsMap, setDatasetVersionsMap] = useState<Record<string, any[]>>({});
  
  const [judgeModel, setJudgeModel] = useState('gpt-4o-mini');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchRuns();
  }, [getToken]);

  async function fetchRuns() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getEvaluationRuns('test-org', token);
      setRuns(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function loadModalData() {
    try {
      const token = await getToken();
      if (!token) return;
      
      const ags = await getAgents('test-org', token);
      setAgents(ags);
      
      const ds = await getDatasets('test-org', token);
      setDatasets(ds);
    } catch (e) {
      console.error(e);
    }
  }

  const handleOpenModal = () => {
    loadModalData();
    setShowModal(true);
  };

  const handleDatasetChange = async (dsId: string) => {
    setSelectedDatasetId(dsId);
    if (!datasetVersionsMap[dsId]) {
      try {
        const token = await getToken();
        if (token) {
           const vs = await getDatasetVersions(dsId, token);
           setDatasetVersionsMap(prev => ({ ...prev, [dsId]: vs }));
           if (vs.length > 0) setSelectedDatasetVersionId(vs[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    } else {
      const vs = datasetVersionsMap[dsId];
      if (vs.length > 0) setSelectedDatasetVersionId(vs[0].id);
    }
  };

  const handleRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const token = await getToken();
      if (!token) return;
      
      await triggerEvaluationRun('test-org', selectedDatasetVersionId, selectedAgentVersionId, judgeModel, token);
      
      setShowModal(false);
      fetchRuns(); // Refresh immediately (will show RUNNING)
    } catch (e) {
      console.error(e);
      alert('Failed to trigger run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Evaluation Runs</h1>
          <p className="text-zinc-400 text-sm">Trigger and review test runs against your Agent Versions.</p>
        </div>
        <button 
          onClick={handleOpenModal}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-500"
        >
          <PlayCircle className="w-4 h-4" /> Run Evaluation
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-500">Loading runs...</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-zinc-950 border-b border-zinc-800 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Agent Version</th>
                <th className="px-6 py-4">Dataset Version</th>
                <th className="px-6 py-4">Pass Rate</th>
                <th className="px-6 py-4">Judge Score Avg</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {runs.map(run => (
                <tr key={run.id} className="hover:bg-zinc-950/50">
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                      run.status === 'COMPLETED' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' :
                      run.status === 'RUNNING' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
                      'bg-red-900/50 text-red-400 border border-red-800'
                    }`}>
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white">
                    {run.agentVersion?.agent?.name} (v{run.agentVersion?.version})
                  </td>
                  <td className="px-6 py-4 text-white">
                    {run.datasetVersion?.dataset?.name} (v{run.datasetVersion?.version})
                  </td>
                  <td className="px-6 py-4">
                    {run.status === 'COMPLETED' ? (
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-medium">{(((run as any).passRate || 0) * 100).toFixed(1)}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    {run.status === 'COMPLETED' && run.judgeConfidenceAvg !== null ? (
                      <div className="flex items-center gap-2">
                        <BarChart className="w-4 h-4 text-purple-400" />
                        <span className="text-white font-medium">{(run.judgeConfidenceAvg! * 100).toFixed(1)}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link href={`/lab/runs/${run.id}`} className="text-blue-400 hover:text-blue-300 inline-flex items-center gap-1 font-medium">
                      View Traces <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                    No runs found. Trigger an evaluation to see results here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleRun} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-emerald-400" /> New Evaluation Run
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Agent Version</label>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    required
                    value={selectedAgentId}
                    onChange={e => setSelectedAgentId(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm"
                  >
                    <option value="">Select Agent...</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                  
                  <select 
                    required
                    value={selectedAgentVersionId}
                    onChange={e => setSelectedAgentVersionId(e.target.value)}
                    disabled={!selectedAgentId}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm disabled:opacity-50"
                  >
                    <option value="">Select Version...</option>
                    {agents.find(a => a.id === selectedAgentId)?.versions?.map(v => (
                      <option key={v.id} value={v.id}>v{v.version}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Dataset Version</label>
                <div className="grid grid-cols-2 gap-2">
                  <select 
                    required
                    value={selectedDatasetId}
                    onChange={e => handleDatasetChange(e.target.value)}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm"
                  >
                    <option value="">Select Dataset...</option>
                    {datasets.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                  
                  <select 
                    required
                    value={selectedDatasetVersionId}
                    onChange={e => setSelectedDatasetVersionId(e.target.value)}
                    disabled={!selectedDatasetId || !datasetVersionsMap[selectedDatasetId]}
                    className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm disabled:opacity-50"
                  >
                    <option value="">Select Version...</option>
                    {datasetVersionsMap[selectedDatasetId]?.map(v => (
                      <option key={v.id} value={v.id}>v{v.version}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">LLM Judge Model</label>
                <select 
                  value={judgeModel}
                  onChange={e => setJudgeModel(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 text-sm"
                >
                  <option value="gpt-4o">GPT-4o (Most Accurate)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast/Cheap)</option>
                </select>
                <p className="text-xs text-zinc-500 mt-1">If no OpenAI key is configured, judge execution will be mocked.</p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-zinc-800">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white px-4 py-2 text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2"
              >
                {isSubmitting ? 'Starting...' : 'Start Run'} <Zap className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
