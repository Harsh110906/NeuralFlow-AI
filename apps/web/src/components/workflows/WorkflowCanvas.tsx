'use client';

import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { TriggerNode } from './nodes/TriggerNode';
import { AgentNode } from './nodes/AgentNode';
import { ToolNode } from './nodes/ToolNode';
import { LogicNode } from './nodes/LogicNode';
import { ExecutionPanel } from '../executions/ExecutionPanel';
import { CopilotPanel } from '../copilot/CopilotPanel';
import { useAuth } from '@clerk/nextjs';
import { updateWorkflow } from '@/lib/api/workflows';
import { runWorkflowDoctor, DiagnosticIssue } from '@/lib/api/doctor';

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  tool: ToolNode,
  logic: LogicNode,
};

const initialNodes = [
  { id: '1', position: { x: 250, y: 5 }, data: { label: 'Webhook Trigger' }, type: 'input' },
];
const initialEdges: Edge[] = [];

function Canvas({ workflowId, initialData }: { workflowId: string, initialData?: any }) {
  // Restore handling: fallback to empty array or initialNodes if initialData is invalid
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || initialEdges);
  const [isSaving, setIsSaving] = useState(false);
  
  // Validation States
  const [isStructurallyValid, setIsStructurallyValid] = useState(true);
  const [semanticErrors, setSemanticErrors] = useState<string[]>([]);


  const { getViewport } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [simulationInfo, setSimulationInfo] = useState<any>(null);

  // Doctor States
  const [isDoctorRunning, setIsDoctorRunning] = useState(false);
  const [doctorIssues, setDoctorIssues] = useState<DiagnosticIssue[] | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);

  // Copilot States
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  
  // Generative Preview States
  const [previewDag, setPreviewDag] = useState<{nodes: any[], edges: any[]} | null>(null);
  const [previewDoctorIssues, setPreviewDoctorIssues] = useState<DiagnosticIssue[] | null>(null);

  const { getToken } = useAuth();
  
  const handleGenerateWorkflow = async (dagJson: any) => {
    setPreviewDag(dagJson);
    try {
      const token = await getToken();
      // Run Doctor on preview immediately
      const issues = await runWorkflowDoctor(workflowId, 'dummy-workspace-id', dagJson, token);
      setPreviewDoctorIssues(issues);
    } catch (e) {
      console.error(e);
      setPreviewDoctorIssues([{ severity: 'ERROR', message: 'Failed to run Doctor on generated workflow.' }]);
    }
  };

  const applyPreview = () => {
    if (previewDag) {
      setNodes(previewDag.nodes);
      setEdges(previewDag.edges);
      setPreviewDag(null);
      setPreviewDoctorIssues(null);
    }
  };

  const cancelPreview = () => {
    setPreviewDag(null);
    setPreviewDoctorIssues(null);
  };

  // Validation Logic
  useEffect(() => {
    // Structural Validation: Nodes/Edges exist and form a basic DAG (mock)
    if (nodes.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStructurallyValid(true);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsStructurallyValid(false);
    }

    // Reset Doctor status when graph changes
    setDoctorIssues(null);

  }, [nodes, edges]);

  // Semantic readiness now relies on Doctor output
  const hasDoctorErrors = doctorIssues?.some(i => i.severity === 'ERROR') || false;
  // If doctor hasn't run, we assume it needs setup/is not ready, or we could just rely on structural.
  // We'll enforce that the Doctor MUST be run and return no errors to be "READY".
  const isReadyToRun = doctorIssues !== null && !hasDoctorErrors && isStructurallyValid;

  const handleRunDoctor = async () => {
    setIsDoctorRunning(true);
    try {
      const token = await getToken();
      const issues = await runWorkflowDoctor(workflowId, 'dummy-workspace-id', { nodes, edges }, token);
      setDoctorIssues(issues);
      setShowDoctorModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to run diagnostics.');
    } finally {
      setIsDoctorRunning(false);
    }
  };

  const handleSave = async () => {
    if (!isStructurallyValid) {
      alert('Workflow structural validation failed. Cannot save.');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken();
      const viewport = getViewport();
      
      // Structural Serialization payload
      const dagPayload = {
        schemaVersion: 1,
        nodes,
        edges,
        viewport
      };

      await updateWorkflow(workflowId, { dagJson: dagPayload }, token);
      alert('Saved structurally valid workflow!');
    } catch (err) {
      console.error(err);
      alert('Failed to save workflow.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRun = async () => {
    if (!isReadyToRun) {
      alert(`Cannot run workflow. Semantic validation failed:\n\n${semanticErrors.join('\n')}`);
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/executions/start/${workflowId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to start execution');
      const data = await response.json();
      setActiveExecutionId(data.id);
    } catch (err) {
      console.error(err);
      alert('Failed to start workflow execution.');
    }
  };

  const handleSimulate = async () => {
    if (!isStructurallyValid) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/simulator/run/${workflowId}`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Simulation failed');
      const data = await response.json();
      setSimulationInfo(data);
    } catch (err) {
      console.error(err);
      alert('Simulation failed.');
    }
  };

  return (
    <div className="w-full h-full relative" style={{ minHeight: '600px' }}>
      {/* Top Banner indicating Readiness Status */}
      {!previewDag && (
        <div className="absolute top-0 left-0 w-full z-10 flex justify-center mt-2 pointer-events-none">
          {isReadyToRun ? (
            <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-300 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              READY TO RUN
            </div>
          ) : (
            <div className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-300 shadow-sm flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              NEEDS SETUP: RUN DOCTOR
            </div>
          )}
        </div>
      )}

      {/* Preview Banner */}
      {previewDag && (
        <div className="absolute top-0 left-0 w-full z-10 flex justify-center mt-2">
          <div className="bg-indigo-100 text-indigo-800 px-6 py-2 rounded-full text-sm font-bold border border-indigo-300 shadow-lg flex items-center gap-4">
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              PREVIEW: AI GENERATED WORKFLOW
            </span>
            <div className="h-4 w-px bg-indigo-300"></div>
            {previewDoctorIssues?.some(i => i.severity === 'ERROR') ? (
               <span className="text-red-600 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Requires fixes</span>
            ) : (
               <span className="text-emerald-600 flex items-center gap-1"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Passed Doctor</span>
            )}
            <div className="flex gap-2 ml-4">
              <button onClick={cancelPreview} className="px-3 py-1 bg-white hover:bg-gray-50 text-indigo-700 rounded-md shadow-sm transition-colors">Discard</button>
              <button 
                onClick={applyPreview} 
                disabled={previewDoctorIssues?.some(i => i.severity === 'ERROR')}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md shadow-sm transition-colors disabled:opacity-50"
              >
                Apply to Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`absolute top-4 ${isCopilotOpen ? 'right-[340px]' : 'right-4'} z-10 flex gap-2 transition-all duration-300`}>
        <button
          onClick={() => setIsCopilotOpen(!isCopilotOpen)}
          className={`px-4 py-2 ${isCopilotOpen ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-200'} font-bold rounded-md shadow-sm hover:bg-indigo-50 border flex items-center gap-2`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Copilot
        </button>
        <button
          onClick={handleRunDoctor}
          disabled={isDoctorRunning}
          className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-md shadow-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
          {isDoctorRunning ? 'Analyzing...' : 'Run Doctor'}
        </button>
        <button
          onClick={handleSimulate}
          disabled={!isStructurallyValid}
          className="px-4 py-2 bg-purple-600 text-white font-bold rounded-md shadow-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          Simulate
        </button>
        <button
          onClick={handleRun}
          disabled={!isReadyToRun}
          title={!isReadyToRun ? 'Run Doctor and resolve ERRORS to enable execution' : ''}
          className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-md shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Run Workflow
        </button>
        <button
          onClick={handleSave}
          disabled={isSaving || !isStructurallyValid}
          className="px-4 py-2 bg-blue-600 text-white font-bold rounded-md shadow-sm hover:bg-blue-700 disabled:opacity-50 transition-opacity"
        >
          {isSaving ? 'Saving...' : 'Save Draft'}
        </button>
      </div>

      {simulationInfo && (
        <div className="absolute top-16 right-4 z-10 bg-purple-900/90 border border-purple-500 rounded-md p-4 w-80 text-white shadow-xl backdrop-blur">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm">Simulation Results</h3>
            <button onClick={() => setSimulationInfo(null)}>&times;</button>
          </div>
          <div className="text-xs space-y-1 font-mono">
            <div>Risk Score: <span className={simulationInfo.riskScore === 'LOW RISK' ? 'text-emerald-400' : simulationInfo.riskScore === 'HIGH RISK' ? 'text-red-400' : 'text-yellow-400'}>{simulationInfo.riskScore}</span></div>
            <div>Est. Runtime: {simulationInfo.estimatedRuntime}ms</div>
            <div>Est. Cost: ${simulationInfo.estimatedCost?.toFixed(4)}</div>
            <div>Est. Tokens: {simulationInfo.estimatedTokens}</div>
          </div>
        </div>
      )}

      {activeExecutionId && (
        <ExecutionPanel 
          executionId={activeExecutionId} 
          workflowId={workflowId} 
          onClose={() => setActiveExecutionId(null)} 
        />
      )}

      {showDoctorModal && doctorIssues && (
        <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-800">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                  Diagnostic Report
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {hasDoctorErrors ? 'Resolve errors to run workflow.' : 'Workflow is ready to run.'}
                </p>
              </div>
              <button onClick={() => setShowDoctorModal(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-white">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-gray-50 dark:bg-zinc-950">
              {doctorIssues.length === 0 ? (
                <div className="p-8 text-center text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <p className="font-bold">No issues found!</p>
                  <p className="text-sm mt-1">Your workflow is perfectly configured.</p>
                </div>
              ) : (
                doctorIssues.map((issue, idx) => {
                  const colors = {
                    ERROR: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300',
                    WARNING: 'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-300',
                    INFO: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300'
                  };
                  return (
                    <div key={idx} className={`p-4 rounded-lg border ${colors[issue.severity]}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${issue.severity === 'ERROR' ? 'bg-red-200 dark:bg-red-800' : issue.severity === 'WARNING' ? 'bg-yellow-200 dark:bg-yellow-800' : 'bg-blue-200 dark:bg-blue-800'}`}>
                            {issue.severity}
                          </span>
                          {issue.nodeId && <span className="font-mono text-xs opacity-75">Node: {issue.nodeId}</span>}
                        </div>
                      </div>
                      <p className="font-medium text-sm mb-2">{issue.message}</p>
                      {issue.fixHint && (
                        <div className="text-xs bg-white/50 dark:bg-black/20 p-2 rounded flex items-start gap-2">
                          <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          <span>{issue.fixHint}</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      
      {isCopilotOpen && (
        <CopilotPanel 
          onClose={() => setIsCopilotOpen(false)} 
          onGenerateWorkflow={handleGenerateWorkflow} 
        />
      )}

      <div className={`w-full h-full transition-all duration-300 ${isCopilotOpen ? 'pr-80' : ''}`}>
        <ReactFlow
          nodes={previewDag ? previewDag.nodes : nodes}
          edges={previewDag ? previewDag.edges : edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className={previewDag ? 'opacity-70 pointer-events-none filter grayscale-[30%]' : ''}
        >
          <Controls />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>
    </div>
  );
}

export function WorkflowCanvas(props: { workflowId: string, initialData?: any }) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  );
}
