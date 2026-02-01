
// Fix: Import d3 as a namespace to resolve missing named exports/types in environment
import * as d3 from 'd3';
import { LayoutNode } from '../hooks/use-dag-layout';
import { GraphEdge } from '@/types';
import { edgeColorScale, getNodeStyles } from './graph-styles';

/**
 * Renders the edge paths. 
 * Note: 'transition-all' is removed to fix path-update lag during dragging.
 */
export const renderLinks = (container: any, edges: GraphEdge[]) => {
  return container.append("g")
    .selectAll("path")
    .data(edges)
    .join("path")
    .attr("fill", "none")
    .attr("marker-end", "url(#arrowhead)")
    .attr("stroke", (d: any) => edgeColorScale(d.proportion))
    .attr("stroke-width", (d: any) => 1 + d.proportion * 5)
    .attr("stroke-opacity", (d: any) => 0.4 + d.proportion * 0.6);
};

/**
 * Renders edge proportion labels.
 */
export const renderLabels = (container: any, edges: GraphEdge[]) => {
  return container.append("g")
    .selectAll("text")
    .data(edges)
    .join("text")
    .attr("font-size", "9px")
    .attr("font-weight", "900")
    .attr("fill", "#000000")
    .attr("text-anchor", "middle")
    .attr("pointer-events", "none")
    .text((d: any) => d.proportion.toFixed(2));
};

/**
 * Renders node groups with circles and text.
 */
export const renderNodes = (container: any, nodes: LayoutNode[]) => {
  const nodeGroups = container.append("g")
    .selectAll("g")
    .data(nodes)
    .join("g")
    .attr("cursor", "grab");

  const circles = nodeGroups.append("circle")
    .attr("r", 25)
    .attr("fill", (d: any) => getNodeStyles(d.type).fill)
    .attr("stroke", (d: any) => getNodeStyles(d.type).stroke)
    .attr("stroke-width", 2)
    .attr("class", "transition-all duration-300 shadow-sm");

  nodeGroups.append("text")
    .attr("dy", 40)
    .attr("text-anchor", "middle")
    .attr("font-size", "10px")
    .attr("font-weight", "900")
    .attr("class", "uppercase tracking-tighter fill-slate-900 pointer-events-none select-none")
    .text((d: any) => d.label);

  return { nodeGroups, circles };
};
