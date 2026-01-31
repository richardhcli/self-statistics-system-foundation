
// Fix: Use namespace import for D3 to solve missing named export issues
import * as d3 from 'd3';
import { LayoutNode } from '../hooks/use-dag-layout';
import { GraphEdge } from '@/types';

/**
 * Creates and configures the D3 Force Simulation for the Concept Graph.
 * Uses high strength values to enforce rigid, non-elastic topological alignment.
 */
export const configureSimulation = (
  nodes: LayoutNode[],
  edges: GraphEdge[]
): any => { // Fix: Use any for Simulation return type
  return (d3 as any).forceSimulation(nodes)
    // No elastic link strength to maintain topological order
    .force("link", (d3 as any).forceLink(edges).id((d: any) => d.id).distance(200).strength(0))
    // Increased strength for ultra-rigid vertical/horizontal alignment
    .force("x", (d3 as any).forceX((d: any) => d.targetX).strength(2.5))
    .force("y", (d3 as any).forceY((d: any) => d.targetY).strength(2.5))
    // Higher velocity decay makes nodes stop much faster, reducing bounce
    .velocityDecay(0.8)
    .alphaDecay(0.1);
};
