'use client';

import { ArrowRight, Database, PlayCircle } from 'lucide-react';
import Link from 'next/link';

export default function LabIndexPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-xl">
        <h1 className="text-2xl font-bold text-white mb-2">Welcome to the Evaluator Lab</h1>
        <p className="text-zinc-400 text-lg mb-6">
          Test and score your Agent Versions before deploying them to production. Ensure reliability with Deterministic Assertions and LLM Judges.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col items-start hover:border-purple-500/50 transition-colors">
            <div className="p-3 bg-zinc-900 rounded-lg mb-4">
              <Database className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Evaluation Datasets</h2>
            <p className="text-zinc-400 mb-6 flex-1">
              Create gold-standard test cases with JSON inputs, expected outputs, and robust assertions.
            </p>
            <Link href="/lab/datasets" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200">
              Manage Datasets <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col items-start hover:border-purple-500/50 transition-colors">
            <div className="p-3 bg-zinc-900 rounded-lg mb-4">
              <PlayCircle className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Evaluation Runs</h2>
            <p className="text-zinc-400 mb-6 flex-1">
              Trigger test runs pairing an Agent Version with a Dataset Version. View detailed trace scores.
            </p>
            <Link href="/lab/runs" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200">
              View Runs <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="bg-zinc-950 border border-zinc-800 p-6 rounded-xl flex flex-col items-start hover:border-purple-500/50 transition-colors">
            <div className="p-3 bg-zinc-900 rounded-lg mb-4">
              <PlayCircle className="w-6 h-6 text-purple-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Manual Playground</h2>
            <p className="text-zinc-400 mb-6 flex-1">
              Manually test agent versions and curate the outputs into structured test cases.
            </p>
            <Link href="/lab/playground" className="text-sm font-medium bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-zinc-200">
              Open Playground <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
