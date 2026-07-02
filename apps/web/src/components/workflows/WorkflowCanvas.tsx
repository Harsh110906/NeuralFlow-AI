'use client';

import { useCallback, useState, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
  reconnectEdge,
  OnSelectionChangeParams,
  MiniMap
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { DensityProvider, useDensity } from './contexts/WorkflowContexts';

import { TriggerNode } from './nodes/TriggerNode';
import { AgentNode } from './nodes/AgentNode';
import { ToolNode } from './nodes/ToolNode';
import { LogicNode } from './nodes/LogicNode';
import { ExecutionPanel } from '../executions/ExecutionPanel';
import { SidebarPanel } from './SidebarPanel';
import { useAuth } from '@clerk/nextjs';
import { updateWorkflow } from '@/lib/api/workflows';
import { runWorkflowDoctor, DiagnosticIssue } from '@/lib/api/doctor';
import { useUndoRedo } from '../../hooks/useUndoRedo';
import { CommandPalette } from './CommandPalette';

const nodeTypes = {
  trigger: TriggerNode,
  agent: AgentNode,
  tool: ToolNode,
  logic: LogicNode,
};

const initialNodes = [
  { id: '1', position: { x: 250, y: 5 }, data: { label: 'Webhook Trigger' }, type: 'trigger' },
];
const initialEdges: Edge[] = [];

const defaultEdgeOptions = {
  type: 'default',
  animated: true,
  style: { strokeWidth: 2 },
};

function Canvas({ workflowId, workspaceId, initialData }: { workflowId: string, workspaceId: string, initialData?: any }) {
  // Restore handling
  const [nodes, setNodes, onNodesChange] = useNodesState(initialData?.nodes || initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData?.edges || initialEdges);
  
  const { undo, redo, takeSnapshot } = useUndoRedo(initialNodes, initialEdges, setNodes, setEdges);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isStructurallyValid, setIsStructurallyValid] = useState(true);
  
  const { getViewport } = useReactFlow();
  const { density, setDensity } = useDensity();
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      takeSnapshot();
      setEdges((eds) => addEdge(params, eds));
    },
    [setEdges, takeSnapshot]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      takeSnapshot();
      setEdges((els) => reconnectEdge(oldEdge, newConnection, els));
    },
    [setEdges, takeSnapshot]
  );

  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    if (nodes.length === 1) {
      setSelectedNode(nodes[0]);
    } else {
      setSelectedNode(null);
    }
  }, []);

  const handleUpdateNode = useCallback((nodeId: string, newData: any) => {
    takeSnapshot();
    setNodes((nds) => nds.map(node => {
      if (node.id === nodeId) {
        return { ...node, data: { ...node.data, ...newData } };
      }
      return node;
    }));
  }, [setNodes, takeSnapshot]);

  // Sidebar States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Execution & Simulation States
  const [activeExecutionId, setActiveExecutionId] = useState<string | null>(null);
  const [simulationInfo, setSimulationInfo] = useState<any>(null);

  // Doctor States
  const [isDoctorRunning, setIsDoctorRunning] = useState(false);
  const [doctorIssues, setDoctorIssues] = useState<DiagnosticIssue[] | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  
  // Generative Preview States
  const [previewDag, setPreviewDag] = useState<{nodes: any[], edges: any[]} | null>(null);
  const [previewDoctorIssues, setPreviewDoctorIssues] = useState<DiagnosticIssue[] | null>(null);

  const { getToken } = useAuth();
  
  const handleGenerateWorkflow = async (dagJson: any) => {
    setPreviewDag(dagJson);
    try {
      const token = await getToken();
      const issues = await runWorkflowDoctor(workflowId, 'dummy-workspace-id', dagJson, token);
      setPreviewDoctorIssues(issues);
    } catch (e) {
      console.error(e);
      setPreviewDoctorIssues([{ severity: 'ERROR', message: 'Failed to run Doctor on generated workflow.' }]);
    }
  };

  const applyPreview = () => {
    if (previewDag) {
      takeSnapshot();
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

  const handleAddNode = (type: string, label: string, position?: {x: number, y: number}) => {
    takeSnapshot();
    const id = `${type}-${Date.now()}`;
    const newNode = {
      id,
      type,
      position: position || { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
      data: { label },
    };
    setNodes((nds) => [...nds, newNode]);
    return id;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCommandSelect = (item: any) => {
    setShowCommandPalette(false);
    takeSnapshot();
    
    let spawnPosition = { x: 250, y: 250 };
    if (selectedNode) {
      spawnPosition = { 
        x: selectedNode.position.x + 300, 
        y: selectedNode.position.y 
      };
    } else {
      const { x, y, zoom } = getViewport();
      spawnPosition = { x: -x/zoom + window.innerWidth/(2*zoom), y: -y/zoom + window.innerHeight/(2*zoom) };
    }

    const newNodeId = handleAddNode(item.type, item.label, spawnPosition);

    if (selectedNode) {
      setEdges((eds) => [
        ...eds,
        {
          id: `e-${selectedNode.id}-${newNodeId}`,
          source: selectedNode.id,
          target: newNodeId,
          sourceHandle: 'source',
          targetHandle: 'target',
          type: 'default',
        }
      ]);
    }
  };

  // Validation Logic
  useEffect(() => {
    if (nodes.length > 0) setIsStructurallyValid(true);
    else setIsStructurallyValid(false);
    setDoctorIssues(null);
  }, [nodes, edges]);

  // Autosave Debounce Logic
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const performSave = async (currentNodes: Node[], currentEdges: Edge[]) => {
    if (!isStructurallyValid) return;
    setSaveStatus('saving');
    try {
      const token = await getToken();
      const viewport = getViewport();
      const dagPayload = { schemaVersion: 1, nodes: currentNodes, edges: currentEdges, viewport };
      await updateWorkflow(workflowId, { dagJson: dagPayload }, token);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      performSave(nodes, edges);
    }, 2000);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [nodes, edges]);

  const isReadyToRun = doctorIssues !== null && !(doctorIssues?.some(i => i.severity === 'ERROR')) && isStructurallyValid;

  const handleRunDoctor = async () => {
    setIsDoctorRunning(true);
    try {
      const token = await getToken();
      const wfRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/workflows/${workflowId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const wf = wfRes.ok ? await wfRes.json() : null;
      const actualWorkspaceId = wf?.workspaceId || 'dummy-workspace-id';
      
      const issues = await runWorkflowDoctor(workflowId, actualWorkspaceId, { nodes, edges }, token);
      setDoctorIssues(issues);
      setShowDoctorModal(true);
    } catch (err) {
      console.error(err);
      alert('Failed to run diagnostics.');
    } finally {
      setIsDoctorRunning(false);
    }
  };

  const handleRun = async () => {
    if (!isReadyToRun) {
      alert(`Cannot run workflow. Semantic validation failed.`);
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
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {isReadyToRun ? (
              <div className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-xs font-bold border border-emerald-300 shadow-sm flex items-center gap-2 self-start">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                READY TO RUN
              </div>
            ) : (
              <div className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-xs font-bold border border-amber-300 shadow-sm flex items-center gap-2 self-start">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                NEEDS SETUP: RUN DOCTOR
              </div>
            )}
            {/* Auto-Save Indicator */}
            {saveStatus === 'saving' && <span className="text-xs font-bold text-gray-400 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">Saving...</span>}
            {saveStatus === 'saved' && <span className="text-xs font-bold text-emerald-500 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">Saved</span>}
            {saveStatus === 'error' && <span className="text-xs font-bold text-red-500 bg-white/50 dark:bg-black/20 px-2 py-1 rounded">Save Error</span>}
          </div>

          {/* Manual Node Addition Toolbar */}
          <div className="bg-white/10 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 p-2 rounded-xl shadow-lg flex flex-col gap-2 w-48">
            <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider px-2 pt-1">Add Nodes</h3>
            <button onClick={() => handleAddNode('trigger', 'New Trigger')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Trigger
            </button>
            <button onClick={() => handleAddNode('agent', 'New Agent')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span> Agent
            </button>
            <button onClick={() => handleAddNode('tool', 'New Tool')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Tool
            </button>
            <button onClick={() => handleAddNode('logic', 'New Logic')} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors text-left border border-transparent hover:border-gray-200 dark:hover:border-zinc-700">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span> Logic
            </button>
          </div>
        </div>
      )}

      {/* Preview Banner */}
      {previewDag && (
        <div className="absolute top-4 left-4 z-10 flex">
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

      {/* Editor Actions Toolbar */}
      <div className={`absolute top-4 ${isSidebarOpen ? 'right-[340px]' : 'right-4'} z-10 flex gap-2 items-center transition-all duration-300`}>
        <div className="flex bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 rounded-md shadow-sm mr-2 overflow-hidden">
          <button onClick={undo} className="px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800" title="Undo (Ctrl+Z)"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg></button>
          <div className="w-px bg-gray-200 dark:bg-zinc-700"></div>
          <button onClick={redo} className="px-3 py-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 dark:hover:bg-zinc-800" title="Redo (Ctrl+Shift+Z)"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg></button>
        </div>

        <button
          onClick={() => setDensity(density === 'compact' ? 'expanded' : 'compact')}
          className="px-4 py-2 bg-white text-gray-700 dark:bg-zinc-900 dark:text-gray-300 border-gray-200 dark:border-zinc-700 font-bold rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-zinc-800 border flex items-center gap-2 transition-colors"
          title="Toggle Canvas Density"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          {density === 'compact' ? 'Expand' : 'Compact'}
        </button>

        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className={`px-4 py-2 ${isSidebarOpen ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-white text-gray-700 border-gray-200'} font-bold rounded-md shadow-sm hover:bg-indigo-50 border flex items-center gap-2`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" /></svg>
          Sidebar
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
          Run
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

      {/* Doctor Modal */}
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
                  {doctorIssues?.some(i => i.severity === 'ERROR') ? 'Resolve errors to run workflow.' : 'Workflow is ready to run.'}
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
      
      {isSidebarOpen && (
        <SidebarPanel 
          workspaceId={workspaceId}
          selectedNode={selectedNode}
          onUpdateNode={handleUpdateNode}
          onClose={() => setIsSidebarOpen(false)} 
          onGenerateWorkflow={handleGenerateWorkflow} 
        />
      )}

      <div className={`w-full h-full transition-all duration-300 ${isSidebarOpen ? 'pr-80' : ''}`}>
        <ReactFlow
          colorMode="dark"
          nodes={previewDag ? previewDag.nodes : nodes}
          edges={previewDag ? previewDag.edges : edges}
          onNodesChange={(changes) => {
            if (changes.some(c => c.type === 'position' || c.type === 'remove')) {
              takeSnapshot();
            }
            onNodesChange(changes);
          }}
          onEdgesChange={(changes) => {
            if (changes.some(c => c.type === 'remove' || c.type === 'add')) {
              takeSnapshot();
            }
            onEdgesChange(changes);
          }}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onSelectionChange={onSelectionChange}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          deleteKeyCode={["Backspace", "Delete"]}
          multiSelectionKeyCode="Shift"
          selectionOnDrag={true}
          panOnScroll={true}
          onlyRenderVisibleElements={true}
          fitView
          className={previewDag ? 'opacity-70 pointer-events-none filter grayscale-[30%]' : ''}
        >
          <Controls />
          <MiniMap zoomable pannable position="bottom-right" className="!bg-zinc-900 border-zinc-800" maskColor="rgba(0,0,0,0.5)" />
          <Background gap={12} size={1} />
        </ReactFlow>
      </div>

      <CommandPalette 
        isOpen={showCommandPalette} 
        onClose={() => setShowCommandPalette(false)} 
        onSelect={handleCommandSelect} 
      />
    </div>
  );
}

export function WorkflowCanvas(props: { workflowId: string, workspaceId: string, initialData?: any }) {
  return (
    <ReactFlowProvider>
      <DensityProvider>
        <Canvas {...props} />
      </DensityProvider>
    </ReactFlowProvider>
  );
}
