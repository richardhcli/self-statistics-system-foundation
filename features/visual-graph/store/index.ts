import { useState, useCallback } from 'react';
import { NodeType } from '@/stores/cdag-topology/types';

/**
 * Types specifically for the D3-based graph visualization.
 * This is purely view-state and does not dictate the logical hierarchy.
 */

export interface GraphNode {
  /** Unique identifier (slugified label) */
  id: string;
  /** Display label */
  label: string;
  /** Depth in the CDAG hierarchy (0 = root) */
  level: number;
  /** Categorization for visual encoding */
  type: NodeType;
  /** D3 Force Simulation coordinate */
  x?: number;
  /** D3 Force Simulation coordinate */
  y?: number;
  /** Fixed position (used for dragging) */
  fx?: number | null;
  /** Fixed position (used for dragging) */
  fy?: number | null;
}

export interface GraphEdge {
  /** Unique identifier for the edge */
  id: string;
  /** ID of the source node */
  source: string;
  /** ID of the target node */
  target: string;
  /** Optional edge label */
  label?: string;
  /** Relative importance or weight of the connection */
  proportion: number;
}

/**
 * Visual metadata store for D3 simulation.
 * This is local state for the visual-graph feature.
 */
export interface VisualGraph {
  /** Current list of active nodes */
  nodes: GraphNode[];
  /** Connections between nodes */
  edges: GraphEdge[];
}

/**
 * Feature Hook: Visual Graph State Management
 * 
 * This is a LOCAL state hook specific to the visual-graph feature.
 * Uses React.useState for component-level state management.
 * 
 * Usage:
 * const { graph, updateNode, addEdge, resetGraph } = useVisualGraph();
 */
export const useVisualGraph = () => {
  const [graph, setGraph] = useState<VisualGraph>({
    nodes: [],
    edges: [],
  });

  const setNodes = useCallback((nodes: GraphNode[]) => {
    setGraph((prev) => ({ ...prev, nodes }));
  }, []);

  const setEdges = useCallback((edges: GraphEdge[]) => {
    setGraph((prev) => ({ ...prev, edges }));
  }, []);

  const updateNode = useCallback((nodeId: string, updates: Partial<GraphNode>) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.map((node) =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    }));
  }, []);

  const addNode = useCallback((node: GraphNode) => {
    setGraph((prev) => ({
      ...prev,
      nodes: [...prev.nodes, node],
    }));
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setGraph((prev) => ({
      ...prev,
      nodes: prev.nodes.filter((node) => node.id !== nodeId),
      edges: prev.edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    }));
  }, []);

  const addEdge = useCallback((edge: GraphEdge) => {
    setGraph((prev) => ({
      ...prev,
      edges: [...prev.edges, edge],
    }));
  }, []);

  const removeEdge = useCallback((edgeId: string) => {
    setGraph((prev) => ({
      ...prev,
      edges: prev.edges.filter((edge) => edge.id !== edgeId),
    }));
  }, []);

  const resetGraph = useCallback(() => {
    setGraph({ nodes: [], edges: [] });
  }, []);

  const setFullGraph = useCallback((newGraph: VisualGraph) => {
    setGraph(newGraph);
  }, []);

  return {
    graph,
    setNodes,
    setEdges,
    updateNode,
    addNode,
    removeNode,
    addEdge,
    removeEdge,
    resetGraph,
    setFullGraph,
  };
};
