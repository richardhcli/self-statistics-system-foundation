import React, { useState, useMemo } from 'react';
import { GraphNode, GraphEdge } from '@/types';
import { 
  useGraphNodes, 
  useGraphEdges, 
  useGraphActions,
  useGraphSync,
} from '@/stores/cdag-topology';
import DAGCanvas from './dag-canvas';
import { EditorSidebar } from './editor-sidebar';
import { PropertySidebar } from './property-sidebar';

interface DeveloperGraphViewProps {
  addTopologyNode?: (label: string, parents?: Record<string, number>) => void;
  deleteTopologyNode?: (label: string) => void;
}

/**
 * Developer Graph View - Local-First Architecture
 * 
 * Uses atomic selectors for fine-grained reactivity:
 * - useGraphNodes() only re-renders when nodes change
 * - useGraphEdges() only re-renders when edges change
 * - useGraphActions() provides stable mutation functions
 */
const DeveloperGraphView: React.FC<DeveloperGraphViewProps> = ({ 
  addTopologyNode, 
  deleteTopologyNode 
}) => {
  const [selection, setSelection] = useState<{ type: 'node' | 'edge'; data: any } | null>(null);

  // Atomic selectors - fine-grained reactivity
  const nodeMap = useGraphNodes();
  const edgeMap = useGraphEdges();
  
  // Actions - stable reference to action methods
  const { addNode, updateNode, removeNode, addEdge, removeEdge, updateEdge } = useGraphActions();
  
  // Sync status hook
  const { status: syncStatus, saveGraph } = useGraphSync();

  // Convert Record<id, NodeData> to GraphNode[]
  const nodes: GraphNode[] = useMemo(() => {
    return Object.values(nodeMap).map((nodeData, index) => ({
      id: nodeData.id,
      label: nodeData.label,
      level: 0, // Computed on-the-fly if needed for DAG layout
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

  const handleNodeClick = (node: GraphNode) => {
    setSelection({ type: 'node', data: node });
  };

  const handleEdgeClick = (edge: GraphEdge) => {
    setSelection({ type: 'edge', data: edge });
  };

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
    const edgeId = `${sourceId}-to-${targetId}-${Date.now()}`;
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
    <div className="w-full h-full flex bg-gray-900">
      <div className="flex-1">
        <div className="text-white p-4 flex justify-between items-center">
          <div>
            <h2>Developer Graph View</h2>
            <p className="text-gray-400 text-sm mt-2">
              Nodes: {nodes.length} | Edges: {edges.length}
            </p>
          </div>
          
          {/* Save Button */}
          <button
            onClick={saveGraph}
            disabled={syncStatus === 'saving'}
            className={`px-4 py-2 rounded font-bold text-sm transition-colors ${
              syncStatus === 'saving'
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : syncStatus === 'success'
                ? 'bg-green-600 text-white'
                : syncStatus === 'error'
                ? 'bg-red-600 text-white'
                : syncStatus === 'offline'
                ? 'bg-yellow-600 text-white'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {syncStatus === 'saving' ? 'Saving...' : 'Save Graph'}
          </button>
        </div>
      </div>
      
      {selection && (
        <PropertySidebar
          type={selection.type}
          data={selection.data}
          onUpdate={selection.type === 'node' ? handleUpdateNode : handleUpdateEdge}
        />
      )}

      <EditorSidebar
        nodes={nodes}
        edges={edges}
        onAddNode={handleAddNode}
        onRemoveNode={handleRemoveNode}
        onAddEdge={handleAddEdge}
        onRemoveEdge={handleRemoveEdge}
      />
    </div>
  );
};

export default DeveloperGraphView;
