
import React, { useRef, useState, useEffect } from 'react';
import { useVisualGraph } from '../store';
import { useDagLayout } from '../hooks/use-dag-layout';
import { useGraphRenderer } from '../hooks/use-graph-renderer';
import { GraphLegend } from './graph-legend';

/**
 * Component: GraphView
 * 
 * Concept Graph view orchestrator.
 * Combines stable layered layout logic with strict D3 snapping interaction.
 * Supports multi-node selection via Set-based state.
 */
const GraphView: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 700 });
  
  // Track multiple selected node IDs using a Set for O(1) lookups
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(new Set());

  // Get visual graph data from local store
  const { graph: data } = useVisualGraph();

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: 700
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Use the refined layered layout logic
  const layoutData = useDagLayout(data, dimensions.width, dimensions.height);

  // Use the strict snapping renderer with multi-selection support
  useGraphRenderer(svgRef, containerRef, layoutData, selectedNodeIds, setSelectedNodeIds);

  return (
    <div 
      ref={containerRef} 
      className="bg-white rounded-3xl overflow-hidden relative shadow-inner border border-slate-200"
    >
      <GraphLegend />
      
      <svg 
        ref={svgRef} 
        className="w-full h-[700px] bg-slate-50/30" 
      />
    </div>
  );
};

export default GraphView;
