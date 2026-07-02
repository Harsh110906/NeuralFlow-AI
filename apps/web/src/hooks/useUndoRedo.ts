import { useCallback, useEffect, useState } from 'react';
import { Node, Edge } from '@xyflow/react';

type HistoryItem = { nodes: Node[]; edges: Edge[] };

export function useUndoRedo(
  initialNodes: Node[],
  initialEdges: Edge[],
  setNodes: (nodes: Node[] | ((nds: Node[]) => Node[])) => void,
  setEdges: (edges: Edge[] | ((eds: Edge[]) => Edge[])) => void
) {
  const [past, setPast] = useState<HistoryItem[]>([]);
  const [future, setFuture] = useState<HistoryItem[]>([]);

  const takeSnapshot = useCallback(() => {
    setNodes((nds) => {
      setEdges((eds) => {
        setPast((p) => [...p, { nodes: nds, edges: eds }].slice(-50));
        setFuture([]);
        return eds;
      });
      return nds;
    });
  }, [setNodes, setEdges]);

  const undo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setNodes((nds) => {
      setEdges((eds) => {
        setFuture((f) => [{ nodes: nds, edges: eds }, ...f]);
        return previous.edges;
      });
      return previous.nodes;
    });
  }, [past, setNodes, setEdges]);

  const redo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setNodes((nds) => {
      setEdges((eds) => {
        setPast((p) => [...p, { nodes: nds, edges: eds }]);
        return next.edges;
      });
      return next.nodes;
    });
  }, [future, setNodes, setEdges]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        // Only trigger if not inside an input
        if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
        
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  return { undo, redo, takeSnapshot, canUndo: past.length > 0, canRedo: future.length > 0 };
}
