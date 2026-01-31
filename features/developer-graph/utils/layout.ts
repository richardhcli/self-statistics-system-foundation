
import { VisualGraph, GraphNode, GraphEdge } from '@/types';

/**
 * Calculates a static layered layout for a Directed Acyclic Graph.
 * Nodes are arranged in vertical columns based on their rank (distance from roots).
 */
export const calculateLayout = (data: VisualGraph, width: number, height: number) => {
  const HORIZONTAL_GAP = 250;
  const VERTICAL_GAP = 100;
  
  // 1. Determine ranks (layering)
  const ranks: Record<string, number> = {};
  const adj: Record<string, string[]> = {};
  const inDegree: Record<string, number> = {};

  data.nodes.forEach(n => {
    ranks[n.id] = 0;
    inDegree[n.id] = 0;
    adj[n.id] = [];
  });

  data.edges.forEach(e => {
    const s = typeof e.source === 'string' ? e.source : (e.source as any).id;
    const t = typeof e.target === 'string' ? e.target : (e.target as any).id;
    if (adj[s]) adj[s].push(t);
    if (inDegree[t] !== undefined) inDegree[t]++;
  });

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

  // 2. Group by rank for vertical positioning
  const nodesByRank: Record<number, string[]> = {};
  data.nodes.forEach(n => {
    const r = ranks[n.id];
    if (!nodesByRank[r]) nodesByRank[r] = [];
    nodesByRank[r].push(n.id);
  });

  const layoutNodes: (GraphNode & { x: number, y: number, depth: number })[] = data.nodes.map(n => {
    const r = ranks[n.id];
    const index = nodesByRank[r].indexOf(n.id);
    const count = nodesByRank[r].length;
    
    // Offset from center
    const x = 100 + r * HORIZONTAL_GAP;
    const y = (height / 2) - ((count - 1) * VERTICAL_GAP / 2) + (index * VERTICAL_GAP);
    
    return { ...n, x, y, depth: r };
  });

  const layoutEdges = data.edges.map(e => {
    const sourceNode = layoutNodes.find(n => n.id === (typeof e.source === 'string' ? e.source : (e.source as any).id));
    const targetNode = layoutNodes.find(n => n.id === (typeof e.target === 'string' ? e.target : (e.target as any).id));
    return {
      ...e,
      source: sourceNode,
      target: targetNode,
      weight: e.proportion // map proportion to weight for the reference code
    };
  });

  return { nodes: layoutNodes, edges: layoutEdges };
};
