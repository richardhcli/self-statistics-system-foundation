
import { GraphEdge } from '@/types';
import { edgeColorScale, getNodeStyles } from './graph-styles';

/**
 * Calculates which nodes and edges are semantically connected to the current selection set.
 */
export const getConnectedElements = (selectedNodeIds: Set<string>, edges: GraphEdge[]) => {
  const neighbors = new Set<string>();
  const connectedEdgeIds = new Set<string>();

  if (selectedNodeIds.size > 0) {
    edges.forEach(e => {
      const s = typeof e.source === 'string' ? e.source : (e.source as any).id;
      const t = typeof e.target === 'string' ? e.target : (e.target as any).id;
      
      const isSourceSelected = selectedNodeIds.has(s);
      const isTargetSelected = selectedNodeIds.has(t);

      if (isSourceSelected) {
        neighbors.add(t);
        connectedEdgeIds.add(e.id);
      } 
      if (isTargetSelected) {
        neighbors.add(s);
        connectedEdgeIds.add(e.id);
      }
    });
  }

  // Remove selected nodes from neighbors list to ensure primary highlight takes precedence
  selectedNodeIds.forEach(id => neighbors.delete(id));

  return { neighbors, connectedEdgeIds };
};

/**
 * Applies visual state updates (aura, color, thickness) to D3 selections based on a set of selected nodes.
 * Tiered Highlighting:
 * 1. Selected Nodes: Aura (filter) + Bold Indigo Stroke
 * 2. Neighbor Nodes: Indigo Stroke (lower intensity)
 * 3. Connected Edges: Indigo Stroke
 * 4. Others: Maintain original styles (Full opacity)
 */
export const applySelectionStyles = (
  nodeCircleSelection: any,
  linkSelection: any,
  selectedNodeIds: Set<string>,
  connected: { neighbors: Set<string>, connectedEdgeIds: Set<string> }
) => {
  const isAnythingSelected = selectedNodeIds.size > 0;
  const { neighbors, connectedEdgeIds } = connected;

  // 1. Update Nodes
  nodeCircleSelection
    .attr("stroke", (d: any) => {
      if (!isAnythingSelected) return getNodeStyles(d.type).stroke;
      if (selectedNodeIds.has(d.id)) return "#4f46e5"; // Primary Highlight
      if (neighbors.has(d.id)) return "#818cf8"; // Secondary Highlight (Indigo 400)
      return getNodeStyles(d.type).stroke; // Default
    })
    .attr("stroke-width", (d: any) => {
      if (selectedNodeIds.has(d.id)) return 5;
      if (neighbors.has(d.id)) return 3;
      return 2;
    })
    .attr("filter", (d: any) => 
      selectedNodeIds.has(d.id) ? "drop-shadow(0 0 12px rgba(79,70,229,0.6))" : "none"
    )
    .attr("opacity", 1);

  // 2. Update Edges
  linkSelection
    .attr("stroke", (d: any) => {
      if (isAnythingSelected && connectedEdgeIds.has(d.id)) return "#4f46e5";
      return edgeColorScale(d.proportion);
    })
    .attr("stroke-opacity", (d: any) => {
      if (isAnythingSelected && connectedEdgeIds.has(d.id)) return 1.0;
      return 0.4 + d.proportion * 0.6;
    })
    .attr("stroke-width", (d: any) => {
      const base = 1 + d.proportion * 5;
      return (isAnythingSelected && connectedEdgeIds.has(d.id)) ? base + 2 : base;
    });
};
