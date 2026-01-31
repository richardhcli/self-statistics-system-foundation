
// Fix: Import d3 as a namespace to resolve potential issues with named exports in some type definitions
import * as d3 from 'd3';
import { NodeType } from '@/stores/cdag-topology/types';

/**
 * Visual constants and style mappers for the Concept Graph.
 */

export const EDGE_COLORS = {
  start: "#cbd5e1", // Light Gray (Slate 300)
  end: "#475569",   // Dark Gray (Slate 600)
  highlight: "#4f46e5" // Indigo
};

export const NODE_PALETTE: Record<NodeType, { fill: string; stroke: string }> = {
  characteristic: { fill: "#4f46e5", stroke: "#4338ca" },
  skill: { fill: "#f59e0b", stroke: "#d97706" },
  action: { fill: "#10b981", stroke: "#059669" },
  none: { fill: "#f8fafc", stroke: "#cbd5e1" }
};

// Fix: Use any-casting for interpolateRgb to bypass missing member error
export const edgeColorScale = (d3 as any).interpolateRgb(EDGE_COLORS.start, EDGE_COLORS.end);

export const getNodeStyles = (type: NodeType) => {
  return NODE_PALETTE[type] || NODE_PALETTE.none;
};
