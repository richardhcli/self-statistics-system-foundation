
import React, { useEffect } from 'react';
import { AppData, GraphNode, GraphEdge } from '@/types';
import { calculateLevels } from '@/features/visual-graph/utils/graph-utils';

/**
 * Pure function to derive visualGraph metadata from logical cdagTopology.
 */
export const syncGraphFromTopology = (data: AppData): AppData => {
  const levels = calculateLevels(data.cdagTopology);
  
  // 1. Rebuild nodes while preserving existing x/y coordinates for stability
  const nodes: GraphNode[] = Object.keys(data.cdagTopology).map(label => {
    const id = label.toLowerCase().trim().replace(/\s+/g, '-');
    const existing = data.visualGraph.nodes.find(n => n.id === id);
    const topoNode = data.cdagTopology[label];
    
    return { 
      id, 
      label, 
      level: levels[label] || 0, 
      type: topoNode.type || 'none',
      x: existing?.x, 
      y: existing?.y 
    };
  });

  // 2. Rebuild edges based on parent-child relationships in the topology
  const edges: GraphEdge[] = [];
  Object.entries(data.cdagTopology).forEach(([label, nodeData]) => {
    const targetId = label.toLowerCase().trim().replace(/\s+/g, '-');
    Object.entries(nodeData.parents).forEach(([p, w]) => {
      const sourceId = p.toLowerCase().trim().replace(/\s+/g, '-');
      edges.push({ 
        // Unique ID for the edge to resolve property access errors
        id: `${sourceId}-${targetId}`,
        source: sourceId, 
        target: targetId, 
        proportion: w 
      });
    });
  });

  return { ...data, visualGraph: { nodes, edges } };
};

/**
 * Hook to automate the synchronization of the visual graph whenever the topology changes.
 */
// Added explicit React import to resolve missing namespace error for types Dispatch and SetStateAction
export const useSyncGraphFromTopology = (
  data: AppData,
  setData: React.Dispatch<React.SetStateAction<AppData>>
) => {
  useEffect(() => {
    setData(prev => {
      const synced = syncGraphFromTopology(prev);
      
      // Perform structural check to avoid unnecessary state updates
      const nodesChanged = synced.visualGraph.nodes.length !== prev.visualGraph.nodes.length;
      const edgesChanged = synced.visualGraph.edges.length !== prev.visualGraph.edges.length;
      const typesChanged = synced.visualGraph.nodes.some((n, i) => n.type !== prev.visualGraph.nodes[i]?.type);

      if (!nodesChanged && !edgesChanged && !typesChanged) {
        return prev;
      }
      
      return synced;
    });
  }, [data.cdagTopology, setData]);
};
