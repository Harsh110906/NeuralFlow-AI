'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { getEvaluationRun, getEvaluationTraces, EvaluationRun, EvaluationTrace } from '@/lib/api/evaluation';
import { ArrowLeft, CheckCircle2, XCircle, FileJson, Scale } from 'lucide-react';
import Link from 'next/link';

import { use } from 'react';
export default function RunDetailsPage(props: { params: Promise<{ id: string }> }) {
  const params = use(props.params);
  const [run, setRun] = useState<EvaluationRun | null>(null);
  const [traces, setTraces] = useState<EvaluationTrace[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    async function load() {
      try {
        const token = await getToken();
        if (!token) return;
        
        const r = await getEvaluationRun(params.id, token);
        setRun(r);
        
        const t = await getEvaluationTraces(params.id, token);
        setTraces(t);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id, getToken]);

  if (loading) return <div className="p-6 text-zinc-500">Loading run...</div>;
  if (!run) return <div className="p-6 text-zinc-500">Run not found.</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <Link href="/lab/runs" className="inline-flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Runs
      </Link>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Run against {run.datasetVersion?.dataset?.name} v{run.datasetVersion?.version}
            </h1>
            <p className="text-zinc-400">Agent: {run.agentVersion?.agent?.name} v{run.agentVersion?.version}</p>
          </div>
          <div className="text-right">
             <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${
               run.status === 'COMPLETED' ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' :
               run.status === 'RUNNING' ? 'bg-blue-900/50 text-blue-400 border border-blue-800' :
               'bg-red-900/50 text-red-400 border border-red-800'
             }`}>
               {run.status}
             </span>
          </div>
        </div>

        <div className="bg-purple-900/20 border border-purple-500/30 p-3 rounded-lg mb-6 flex items-start gap-3">
          <Scale className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-purple-200">
            <strong>Note:</strong> Judge reasoning is diagnostic evaluation evidence, not absolute ground truth. Always cross-reference with deterministic assertions for strict behavioral guarantees.
          </p>
        </div>

        <div className="grid grid-cols-4 gap-4 p-4 bg-black rounded-lg border border-zinc-800">
          <div>
            <div className="text-xs text-zinc-500 mb-1">Deterministic Pass Rate</div>
            <div className="text-xl font-bold text-white">{run.deterministicPassRate !== null ? `${(run.deterministicPassRate! * 100).toFixed(1)}%` : '-'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">LLM Judge Avg Score</div>
            <div className="text-xl font-bold text-white">{run.judgeScoreAvg !== null ? `${(run.judgeScoreAvg! * 100).toFixed(1)}%` : '-'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Judge Confidence</div>
            <div className="text-xl font-bold text-white">{run.judgeConfidenceAvg !== null ? `${(run.judgeConfidenceAvg! * 100).toFixed(1)}%` : 'N/A'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Avg Latency</div>
            <div className="text-xl font-bold text-white">{run.avgLatencyMs !== null ? `${run.avgLatencyMs}ms` : '-'}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500 mb-1">Judge Config</div>
            <div className="text-sm font-medium text-purple-400">{run.judgeConfig ? `${run.judgeConfig.model}${run.judgeConfig.isMocked ? ' (Mocked)' : ''}` : 'None'}</div>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-white mt-8 mb-4">Traces ({traces.length})</h2>
      
      <div className="space-y-4">
        {traces.map((trace, idx) => {
           const hasJudge = !!trace.judgeResponse;
           const score = trace.judgeResponse?.score || 0;
           const isJudgePassed = score >= 0.8;
           const isDeterministicPassed = trace.deterministicPassed;

           let overallStatus = 'text-zinc-500';
           let statusText = 'No Assertions';
           if (hasJudge && isDeterministicPassed !== null) {
              overallStatus = (isJudgePassed && isDeterministicPassed) ? 'text-emerald-400' : 'text-red-400';
              statusText = (isJudgePassed && isDeterministicPassed) ? 'Passed All' : 'Failed';
           } else if (hasJudge) {
              overallStatus = isJudgePassed ? 'text-emerald-400' : 'text-red-400';
              statusText = isJudgePassed ? `Judge: ${(score * 100).toFixed(0)}` : `Judge: ${(score * 100).toFixed(0)}`;
           } else if (isDeterministicPassed !== null) {
              overallStatus = isDeterministicPassed ? 'text-emerald-400' : 'text-red-400';
              statusText = isDeterministicPassed ? 'Passed Deterministic' : 'Failed Deterministic';
           }

           return (
            <div key={trace.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="p-3 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                <div className="text-sm font-bold text-white">Test Case #{idx + 1}</div>
                <div className={`flex items-center gap-1.5 text-sm font-bold ${overallStatus}`}>
                  {(overallStatus === 'text-emerald-400') ? <CheckCircle2 className="w-4 h-4" /> : (overallStatus === 'text-red-400') ? <XCircle className="w-4 h-4" /> : null}
                  {statusText}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-zinc-800">
                <div className="bg-zinc-900 p-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-1">
                    <FileJson className="w-3 h-3" /> Input
                  </h4>
                  <pre className="text-xs text-zinc-300 overflow-x-auto whitespace-pre-wrap font-mono bg-black p-3 rounded border border-zinc-800">
                    {JSON.stringify(trace.input, null, 2)}
                  </pre>
                </div>
                <div className="bg-zinc-900 p-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3">Agent Output</h4>
                  <div className="text-sm text-zinc-300 whitespace-pre-wrap p-3">
                    {trace.output?.text || "No output generated."}
                  </div>
                </div>
                <div className="bg-zinc-900 p-4">
                  <h4 className="text-xs font-bold text-zinc-500 uppercase mb-3 flex items-center gap-1">
                    <Scale className="w-3 h-3 text-purple-400" /> Judge Response
                  </h4>
                  <div className="text-sm text-zinc-300">
                    <div className="mb-2"><strong>Reasoning:</strong> {trace.judgeResponse?.reasoning}</div>
                    <div className="text-xs text-zinc-500 mt-4 border-t border-zinc-800 pt-2">
                      Rubric: {trace.rubric}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {traces.length === 0 && (
          <div className="p-8 bg-zinc-900 border border-zinc-800 rounded-xl text-center text-zinc-500">
            No traces available. Did the run fail early?
          </div>
        )}
      </div>
    </div>
  );
}
