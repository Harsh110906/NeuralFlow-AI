import { Metadata } from 'next';
import Link from 'next/link';
import { Beaker, Database, PlayCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Evaluator Lab | NeuralFlow AI',
  description: 'Evaluate agent performance with deterministic assertions and AI judges.',
};

export default function LabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-full bg-black">
      <header className="border-b border-zinc-800 bg-zinc-950 p-4">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-white">
            <Beaker className="w-5 h-5 text-purple-400" />
            <h1 className="font-bold text-lg">Evaluator Lab</h1>
            <span className="bg-purple-900/50 text-purple-400 px-2 py-0.5 rounded text-xs ml-2 border border-purple-800">BETA</span>
          </div>
          
          <nav className="flex items-center gap-4 text-sm font-medium">
            <Link href="/lab" className="text-zinc-400 hover:text-white transition-colors">Overview</Link>
            <Link href="/lab/datasets" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <Database className="w-4 h-4" /> Datasets
            </Link>
            <Link href="/lab/runs" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <PlayCircle className="w-4 h-4" /> Runs
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 overflow-auto p-6">
        {children}
      </main>
    </div>
  );
}
