import React, { useState, useMemo } from 'react';
import { GraphNode, GraphEdge, VisualGraph } from '@/types';
import { 
  useGraphNodes, 
  useGraphEdges, 
  useGraphActions,
} from '@/stores/cdag-topology';
import { useCdagStructure } from '@/hooks/use-cdag-structure';
import { calculateLayout } from '../utils/layout';
import DAGCanvas from './dag-canvas';
import { EditorSidebar } from './editor-sidebar';
import { PropertySidebar } from './property-sidebar';

/**
 * Developer Graph View - Graph Visualization & Editor
 * 
 * Two Responsibilities:
 * 1. Display: Reads from cdag-topology global store and displays using calculateLayout
 * 2. Write: CRUD editor sidebar for adding/removing/updating nodes and edges
 * 
 * Uses atomic selectors for fine-grained reactivity:
 * - useGraphNodes() only re-renders when nodes change
 * - useGraphEdges() only re-renders when edges change
 * - useGraphActions() provides stable mutation functions
 */
const DeveloperGraphView: React.FC = () => {
  useCdagStructure();
  const [selection, setSelection] = useState<{ type: 'node' | 'edge'; data: any } | null>(null);
  const buildEdgeId = (source: string, target: string) => `${source}->${target}`;

  // Atomic selectors - fine-grained reactivity
  const nodeMap = useGraphNodes();
  const edgeMap = useGraphEdges();
  
  // Actions - stable reference to action methods
  const { addNode, updateNode, removeNode, addEdge, removeEdge, updateEdge } = useGraphActions();

  // Convert Record<id, NodeData> to GraphNode[]
  const nodes: GraphNode[] = useMemo(() => {
    return Object.values(nodeMap).map((nodeData) => ({
      id: nodeData.id,
      label: nodeData.label,
      level: 0, // Computed by calculateLayout
      type: nodeData.type,
      x: 0,
      y: 0,
    }));
  }, [nodeMap]);

  // Convert Record<id, EdgeData> to GraphEdge[]
  const edges: GraphEdge[] = useMemo(() => {
    return Object.values(edgeMap).map((edgeData) => ({
      id: edgeData.id,
      source: edgeData.source,
      target: edgeData.target,
      label: edgeData.label,
      proportion: edgeData.weight || 1.0,
    }));
  }, [edgeMap]);

  // Prepare data for DAGCanvas with layout calculations
  const visualGraph: VisualGraph = useMemo(() => ({
    nodes,
    edges,
  }), [nodes, edges]);

  // Display handlers
  const handleNodeClick = (node: GraphNode) => {
    setSelection({ type: 'node', data: node });
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelection({ type: 'edge', data: edge });
  };

  // CRUD handlers
  const handleAddNode = (label: string, parentIds: string[]) => {
    const nodeId = label.toLowerCase().replace(/\s+/g, '-');
    addNode({
      id: nodeId,
      label,
      type: 'action',
      createdAt: new Date().toISOString(),
    });

    // Add edges from parents
    parentIds.forEach((parentId) => {
      const edgeId = `${parentId}-to-${nodeId}`;
      addEdge({
        id: edgeId,
        source: parentId,
        target: nodeId,
        weight: 1.0,
        createdAt: new Date().toISOString(),
      });
    });
  };

  const handleAddEdge = (sourceId: string, targetId: string, weight: number) => {
    const edgeId = buildEdgeId(sourceId, targetId);
    addEdge({
      id: edgeId,
      source: sourceId,
      target: targetId,
      weight,
      createdAt: new Date().toISOString(),
    });
  };

  const handleRemoveNode = (nodeId: string) => {
    removeNode(nodeId);
    setSelection(null);
  };

  const handleRemoveEdge = (edge: GraphEdge) => {
    removeEdge(edge.id);
    setSelection(null);
  };

  const handleUpdateNode = (updated: GraphNode) => {
    updateNode(updated.id, {
      label: updated.label,
      updatedAt: new Date().toISOString(),
    });
    setSelection({ type: 'node', data: updated });
  };

  const handleUpdateEdge = (updated: GraphEdge) => {
    updateEdge(updated.id, {
      weight: updated.proportion,
      label: updated.label,
      updatedAt: new Date().toISOString(),
    });
    setSelection({ type: 'edge', data: updated });
  };

  return (
    <div className="w-full h-full flex bg-slate-50">
      {/* Left Panel: Editor Sidebar */}
      <EditorSidebar
        nodes={nodes}
        edges={edges}
        onAddNode={handleAddNode}
        onRemoveNode={handleRemoveNode}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
      />

      {/* Main content area: Header + Canvas */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div>
            <h2 className="text-lg font-black text-slate-900">Developer Graph</h2>
            <p className="text-xs text-slate-500 mt-1">Nodes: {nodes.length} | Edges: {edges.length}</p>
          </div>
        </div>

        {/* Canvas area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Canvas - takes up available space */}
          <div className="flex-1 relative">
            <DAGCanvas
              data={visualGraph}
              onNodeClick={handleNodeClick}
              onEdgeClick={handleEdgeClick}
              selectedId={selection?.data?.id}
            />
          </div>

          {/* Right Panel: Property Sidebar (when something is selected) */}
          {selection && (
            <PropertySidebar
              selection={selection}
              onUpdateNode={handleUpdateNode}
              onUpdateEdge={handleUpdateEdge}
              onClose={() => setSelection(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DeveloperGraphView;
