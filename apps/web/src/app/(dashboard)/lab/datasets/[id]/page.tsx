'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getDataset, getDatasetVersions, getTestCases, createDatasetVersion, EvaluationDataset, EvaluationDatasetVersion, EvaluationTestCase } from '@/lib/api/evaluation';
import { ArrowLeft, BookOpen, FileJson, Plus } from 'lucide-react';
import Link from 'next/link';

import { use } from 'react';
export default function DatasetDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [dataset, setDataset] = useState<EvaluationDataset | null>(null);
  const [versions, setVersions] = useState<EvaluationDatasetVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<EvaluationDatasetVersion | null>(null);
  const [testCases, setTestCases] = useState<EvaluationTestCase[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [newInputJson, setNewInputJson] = useState('{\n  "query": ""\n}');
  const [newAssertJson, setNewAssertJson] = useState('[\n  { "type": "CONTAINS", "value": "test" }\n]');

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        
        const ds = await getDataset(params.id, token);
        setDataset(ds);
        
        const v = await getDatasetVersions(params.id, token);
        setVersions(v);
        
        if (v.length > 0) {
          setSelectedVersion(v[0]); // select latest
          const tc = await getTestCases(v[0].id, token);
          setTestCases(tc);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, getToken]);

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) return;
      
      const newTestCase = {
        input: JSON.parse(newInputJson),
        assertions: JSON.parse(newAssertJson)
      };

      // Appending to existing test cases for a new version
      const updatedTestCases = [
        ...testCases.map(tc => ({ input: tc.input, expectedOut: tc.expectedOut, assertions: tc.assertions })),
        newTestCase
      ];

      await createDatasetVersion(params.id, "Added new test case", updatedTestCases, token);
      
      setShowAddModal(false);
      
      // Reload versions
      const v = await getDatasetVersions(params.id, token);
      setVersions(v);
      if (v.length > 0) {
        setSelectedVersion(v[0]);
        const tc = await getTestCases(v[0].id, token);
        setTestCases(tc);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to create version. Check JSON format.');
    }
  };

  if (loading) return <div className="p-6 text-zinc-500">Loading dataset...</div>;
  if (!dataset) return <div className="p-6 text-zinc-500">Dataset not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/lab/datasets" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Datasets
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{dataset.name}</h1>
          <p className="text-zinc-400">{dataset.description}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2">
           <label className="text-xs text-zinc-500 block mb-1 px-1">Dataset Version</label>
           <select 
             className="bg-zinc-950 text-white border border-zinc-700 rounded p-1 text-sm outline-none min-w-[120px]"
             value={selectedVersion?.id || ''}
             onChange={async (e) => {
               const v = versions.find(x => x.id === e.target.value);
               if (v) {
                 setSelectedVersion(v);
                 const token = await getToken();
                 if (token) {
                   const tc = await getTestCases(v.id, token);
                   setTestCases(tc);
                 }
               }
             }}
           >
             {versions.map(v => (
               <option key={v.id} value={v.id}>v{v.version}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            Test Cases ({testCases.length})
          </h2>
          <button 
            onClick={() => setShowAddModal(true)}
            className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Test Case
          </button>
        </div>
        <div className="divide-y divide-zinc-800">
          {testCases.map((tc, idx) => (
            <div key={tc.id} className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 hover:bg-zinc-950/50">
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1">
                  <FileJson className="w-3 h-3" /> Input (JSON)
                </h4>
                <pre className="bg-black border border-zinc-800 p-3 rounded-lg text-xs text-zinc-300 overflow-x-auto">
                  {JSON.stringify(tc.input, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="text-xs font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1">
                  <FileJson className="w-3 h-3" /> Assertions (JSON)
                </h4>
                <pre className="bg-black border border-zinc-800 p-3 rounded-lg text-xs text-emerald-400 overflow-x-auto">
                  {JSON.stringify(tc.assertions, null, 2)}
                </pre>
              </div>
            </div>
          ))}
          {testCases.length === 0 && (
            <div className="p-8 text-center text-zinc-500">
              No test cases in this version.
            </div>
          )}
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreateVersion} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-2xl">
            <h2 className="text-xl font-bold text-white mb-2">Add Test Case (Creates New Version)</h2>
            <p className="text-sm text-zinc-400 mb-4">Adding a test case will create an immutable v{versions.length > 0 ? versions[0].version + 1 : 1} dataset.</p>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Input (JSON)</label>
                <textarea 
                  required
                  value={newInputJson}
                  onChange={e => setNewInputJson(e.target.value)}
                  className="w-full bg-black font-mono text-sm border border-zinc-800 rounded-lg px-3 py-2 text-zinc-300 outline-none focus:border-purple-500 h-48"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Assertions (JSON Array)</label>
                <textarea 
                  required
                  value={newAssertJson}
                  onChange={e => setNewAssertJson(e.target.value)}
                  className="w-full bg-black font-mono text-sm border border-zinc-800 rounded-lg px-3 py-2 text-emerald-400 outline-none focus:border-purple-500 h-48"
                />
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold"
              >
                Create Version & Add
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
