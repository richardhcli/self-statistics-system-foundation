import { useMemo } from 'react';
import { VisualGraph, GraphNode, GraphEdge } from '@/types';

/**
 * Interface representing a node with calculated layout properties.
 */
export interface LayoutNode extends GraphNode {
  rank: number;
  indexInRank: number;
  targetX: number;
  targetY: number;
}

/**
 * Hook: useDagLayout
 * 
 * Functional Description:
 * Implements a stable, layered layout algorithm (identical to the Developer Graph).
 * Nodes are arranged in vertical columns based on their topological rank.
 * 
 * @param data - The raw graph data (nodes and edges).
 * @param width - The width of the container.
 * @param height - The height of the container.
 * @returns An object containing nodes with target positions and layout constants.
 */
export const useDagLayout = (data: VisualGraph, width: number, height: number) => {
  const HORIZONTAL_GAP = 250;
  const VERTICAL_GAP = 120;

  const layoutData = useMemo(() => {
    // Defensive check for undefined data or empty arrays
    if (!data || !data.nodes || data.nodes.length === 0 || !width || !height) {
      return { nodes: [], edges: [], VERTICAL_SPACING: VERTICAL_GAP, HORIZONTAL_SPACING: HORIZONTAL_GAP };
    }

    const ranks: Record<string, number> = {};
    const adj: Record<string, string[]> = {};
    const inDegree: Record<string, number> = {};

    // Initialize structures
    data.nodes.forEach(n => {
      ranks[n.id] = 0;
      inDegree[n.id] = 0;
      adj[n.id] = [];
    });

    // Build directed adjacency list
    data.edges.forEach(e => {
      const s = typeof e.source === 'string' ? e.source : (e.source as any).id;
      const t = typeof e.target === 'string' ? e.target : (e.target as any).id;
      if (adj[s]) adj[s].push(t);
      if (inDegree[t] !== undefined) inDegree[t]++;
    });

    // Topological Sort to assign Ranks (Kahn's algorithm variant)
    const queue = data.nodes.filter(n => inDegree[n.id] === 0).map(n => n.id);
    let head = 0;
    while (head < queue.length) {
      const u = queue[head++];
      (adj[u] || []).forEach(v => {
        ranks[v] = Math.max(ranks[v], ranks[u] + 1);
        inDegree[v]--;
        if (inDegree[v] === 0) queue.push(v);
      });
    }

    // Group by rank for vertical stacking
    const nodesByRank: Record<number, string[]> = {};
    data.nodes.forEach(n => {
      const r = ranks[n.id];
      if (!nodesByRank[r]) nodesByRank[r] = [];
      nodesByRank[r].push(n.id);
    });

    // Calculate grid coordinates
    const nodesWithPos: LayoutNode[] = data.nodes.map(n => {
      const r = ranks[n.id];
      const index = nodesByRank[r].indexOf(n.id);
      const count = nodesByRank[r].length;
      
      // Horizontal placement based on rank
      const targetX = 100 + r * HORIZONTAL_GAP;
      // Vertical placement centered in container
      const targetY = (height / 2) - ((count - 1) * VERTICAL_GAP / 2) + (index * VERTICAL_GAP);
      
      return {
        ...n,
        rank: r,
        indexInRank: index,
        targetX,
        targetY,
        x: targetX,
        y: targetY
      };
    });

    return { 
      nodes: nodesWithPos, 
      edges: data.edges, 
      VERTICAL_SPACING: VERTICAL_GAP,
      HORIZONTAL_SPACING: HORIZONTAL_GAP 
    };
  }, [data, width, height]);

  return layoutData;
};
