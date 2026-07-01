'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getDatasets, createDataset, EvaluationDataset } from '@/lib/api/evaluation';
import { Database, Plus } from 'lucide-react';
import Link from 'next/link';

export default function LabDatasetsPage() {
  const [datasets, setDatasets] = useState<EvaluationDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();
  
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');

  useEffect(() => {
    fetchDatasets();
  }, [getToken]);

  async function fetchDatasets() {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await getDatasets('test-org', token);
      setDatasets(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getToken();
      if (!token) return;
      await createDataset('test-org', newName, newDesc, token);
      setShowModal(false);
      setNewName('');
      setNewDesc('');
      fetchDatasets();
    } catch (e) {
      console.error(e);
      alert('Failed to create dataset');
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Evaluation Datasets</h1>
          <p className="text-zinc-400 text-sm">Manage test cases to evaluate your Agent Versions.</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-zinc-200"
        >
          <Plus className="w-4 h-4" /> New Dataset
        </button>
      </div>

      {loading ? (
        <div className="text-zinc-500">Loading datasets...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {datasets.map(ds => (
            <Link href={`/lab/datasets/${ds.id}`} key={ds.id}>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-purple-500/50 transition-colors cursor-pointer h-full flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-zinc-950 border border-zinc-800 rounded-lg">
                    <Database className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="font-bold text-white">{ds.name}</h3>
                </div>
                <p className="text-sm text-zinc-400 line-clamp-2 mb-4 flex-1">
                  {ds.description || 'No description provided.'}
                </p>
                <div className="text-xs text-zinc-500 mt-auto">
                  Created {new Date(ds.createdAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
          {datasets.length === 0 && (
            <div className="col-span-full py-12 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
              No datasets found. Create your first dataset to start evaluating agents.
            </div>
          )}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <form onSubmit={handleCreate} className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Create Dataset</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Name</label>
                <input 
                  type="text" 
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">Description</label>
                <textarea 
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white outline-none focus:border-purple-500 h-24"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setShowModal(false)}
                className="text-zinc-400 hover:text-white px-4 py-2"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg font-bold"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
