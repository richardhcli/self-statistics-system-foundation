
import React, { useEffect, useRef } from 'react';
// Fix: Import d3 as a namespace and use type casting to bypass potentially missing or inconsistent definitions
import * as d3 from 'd3';
import { VisualGraph, GraphNode, GraphEdge } from '@/types';
import { calculateLayout } from '../utils/layout';

interface DAGCanvasProps {
  data: VisualGraph;
  onNodeClick: (n: GraphNode) => void;
  onEdgeClick: (e: GraphEdge) => void;
  selectedId?: string;
}

const DAGCanvas: React.FC<DAGCanvasProps> = ({ data, onNodeClick, onEdgeClick, selectedId }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  // Fix: Use any for ZoomBehavior type due to inconsistent D3 type exports
  const zoomRef = useRef<any>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    // Fix: Use any-casting for d3.select to ensure compatibility
    const svg = (d3 as any).select(svgRef.current);
    
    svg.selectAll('*').remove();

    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead-dev')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 25) 
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#64748b')
      .style('stroke', 'none');

    const g = svg.append('g').attr('class', 'main-container');
    gRef.current = g.node() as SVGGElement;

    // Fix: Use any-casting for d3.zoom to avoid potential property missing errors
    const zoom = (d3 as any).zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event: any) => {
        g.attr('transform', event.transform);
      });
    
    zoomRef.current = zoom;
    svg.call(zoom);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return;
    
    // Fix: Consistent any-casting for d3.select
    const svg = (d3 as any).select(svgRef.current);
    const g = (d3 as any).select(gRef.current);
    const container = svgRef.current.parentElement;
    const width = container?.clientWidth || 800;
    const height = container?.clientHeight || 700;

    const layout = calculateLayout(data, width, height);
    
    g.selectAll('*').remove();

    const linksG = g.append('g').attr('class', 'links');
    const links = linksG.selectAll('.edge-group')
      .data(layout.edges)
      .enter()
      .append('g')
      .attr('class', 'edge-group')
      .attr('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        onEdgeClick(d);
      });

    links.append('path')
      .attr('d', (d: any) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`)
      .attr('fill', 'none')
      .attr('stroke', 'transparent')
      .attr('stroke-width', 15);

    links.append('path')
      .attr('class', 'visible-edge transition-all')
      .attr('d', (d: any) => `M${d.source.x},${d.source.y} L${d.target.x},${d.target.y}`)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => d.id === selectedId ? '#4f46e5' : '#cbd5e1')
      .attr('stroke-width', (d: any) => 2 + (d.id === selectedId ? 2 : 0))
      .attr('marker-end', 'url(#arrowhead-dev)')
      .attr('opacity', (d: any) => d.id === selectedId ? 1 : 0.6);

    const nodesG = g.append('g').attr('class', 'nodes');
    const nodes = nodesG.selectAll('.node-group')
      .data(layout.nodes)
      .enter()
      .append('g')
      .attr('class', 'node-group transition-transform')
      .attr('transform', (d: any) => `translate(${d.x},${d.y})`)
      .attr('cursor', 'pointer')
      .on('click', (event: any, d: any) => {
        event.stopPropagation();
        onNodeClick(d);
      });

    nodes.append('circle')
      .attr('r', 20)
      .attr('fill', (d: any) => d.id === selectedId ? '#1e293b' : 'white')
      .attr('stroke', (d: any) => d.id === selectedId ? '#4f46e5' : '#1e293b')
      .attr('stroke-width', 2)
      .attr('class', 'shadow-sm');

    nodes.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 5)
      .attr('class', 'text-[9px] font-black uppercase tracking-tighter pointer-events-none select-none')
      .attr('fill', (d: any) => d.id === selectedId ? 'white' : '#1e293b')
      .text((d: any) => d.label.length > 12 ? d.label.substring(0, 10) + '...' : d.label);

    const labelsG = g.append('g').attr('class', 'edge-labels');
    labelsG.selectAll('text')
      .data(layout.edges)
      .enter()
      .append('text')
      .attr('x', (d: any) => (d.source.x + d.target.x) / 2)
      .attr('y', (d: any) => (d.source.y + d.target.y) / 2 - 8)
      .attr('class', 'text-[8px] font-black uppercase tracking-widest pointer-events-none select-none')
      .attr('text-anchor', 'middle')
      .attr('fill', (d: any) => d.id === selectedId ? '#4f46e5' : '#94a3b8')
      .text((d: any) => {
        const w = parseFloat(d.weight);
        return isNaN(w) ? '' : w.toFixed(2);
      });

  }, [data, onNodeClick, onEdgeClick, selectedId]);

  return <svg ref={svgRef} className="w-full h-full bg-slate-50" />;
};

export default DAGCanvas;
