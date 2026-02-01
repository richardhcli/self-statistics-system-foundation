
import React, { useEffect, useRef } from 'react';
// Fix: Import D3 as a namespace to resolve missing named exports in certain environments
import * as d3 from 'd3';
import { LayoutNode } from './use-dag-layout';
import { GraphEdge } from '@/types';
import { createDragBehavior, createZoomBehavior } from '../utils/graph-interactions';
import { getConnectedElements, applySelectionStyles } from '../utils/graph-selection';
import { initializeMarkers } from '../utils/graph-setup';
import { configureSimulation } from '../utils/graph-simulation';
import { renderLinks, renderLabels, renderNodes } from '../utils/graph-elements';

/**
 * Hook: useGraphRenderer
 * 
 * Orchestrates the Concept Graph rendering using D3.
 * Implements rigid snapping logic and synchronous visual updates for dragging.
 */
export const useGraphRenderer = (
  svgRef: React.RefObject<SVGSVGElement | null>,
  containerRef: React.RefObject<HTMLDivElement | null>,
  layoutData: { nodes: LayoutNode[], edges: GraphEdge[], VERTICAL_SPACING: number },
  selectedNodeIds: Set<string>,
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>
) => {
  const elementsRef = useRef<{
    circles: any | null;
    links: any | null;
  }>({ circles: null, links: null });

  const selectedIdsRef = useRef<Set<string>>(selectedNodeIds);
  useEffect(() => {
    selectedIdsRef.current = selectedNodeIds;
  }, [selectedNodeIds]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || layoutData.nodes.length === 0) return;
    
    // Fix: Use (d3 as any) to bypass potentially broken or missing select definition
    const svg = (d3 as any).select(svgRef.current);
    svg.selectAll("*").remove(); 
    initializeMarkers(svg);
    const mainGroup = svg.append("g");

    const simulation = configureSimulation(layoutData.nodes, layoutData.edges);
    
    const links = renderLinks(mainGroup, layoutData.edges);
    const labels = renderLabels(mainGroup, layoutData.edges);
    const { nodeGroups, circles } = renderNodes(mainGroup, layoutData.nodes);

    elementsRef.current = { circles: circles as any, links: links as any };

    /**
     * updateVisualPositions
     * Synchronizes SVG elements with the current simulation state.
     * Called during every tick and every drag move.
     */
    const updateVisualPositions = () => {
      links.attr("d", (d: any) => {
        const s = d.source as unknown as LayoutNode;
        const t = d.target as unknown as LayoutNode;
        // Verify source/target objects are resolved before attempting to access coords
        if (s.x === undefined || t.x === undefined) return null;
        return `M${s.x},${s.y} L${t.x},${t.y}`;
      });

      labels
        .attr("x", (d: any) => {
          const s = d.source as unknown as LayoutNode;
          const t = d.target as unknown as LayoutNode;
          return (s.x! + t.x!) / 2;
        })
        .attr("y", (d: any) => {
          const s = d.source as unknown as LayoutNode;
          const t = d.target as unknown as LayoutNode;
          return (s.y! + t.y!) / 2 - 5;
        });

      nodeGroups.attr("transform", (d: any) => `translate(${d.x},${d.y})`);
    };

    nodeGroups
      .on("mousedown", (event: any, d: any) => {
        if (!selectedIdsRef.current.has(d.id)) {
          setSelectedNodeIds(prev => {
            const next = new Set(prev);
            next.add(d.id);
            return next;
          });
        }
      })
      .on("click", (event: any, d: any) => {
        event.stopPropagation();
        setSelectedNodeIds(prev => {
          const next = new Set(prev);
          if (next.has(d.id)) next.delete(d.id);
          else next.add(d.id);
          return next;
        });
      })
      .call(createDragBehavior(simulation, layoutData.nodes, updateVisualPositions) as any);

    svg.call(createZoomBehavior(mainGroup) as any).on("click", () => {
      setSelectedNodeIds(new Set());
    });

    const connected = getConnectedElements(selectedIdsRef.current, layoutData.edges);
    applySelectionStyles(circles, links, selectedIdsRef.current, connected);

    simulation.on("tick", () => {
      // ULTRA-RIGID Position Snapping for nodes not being dragged
      layoutData.nodes.forEach(n => {
        if (n.fx === null || n.fx === undefined) {
          const dx = n.targetX - n.x!;
          const dy = n.targetY - n.y!;
          
          // STRICT SNAP THRESHOLD: If within 1px, mathematically lock to target
          if (Math.abs(dx) < 1 && Math.abs(dy) < 1) {
            n.x = n.targetX;
            n.y = n.targetY;
          } else {
            // Apply extremely heavy return force (0.95) to eliminate elasticity
            n.x! += dx * 0.95;
            n.y! += dy * 0.95;
          }
        }
      });

      updateVisualPositions();
    });

    return () => {
      simulation.stop();
      svg.on(".zoom", null);
      svg.on("click", null);
    };
  }, [layoutData, svgRef, containerRef, setSelectedNodeIds]); 

  useEffect(() => {
    if (!elementsRef.current.circles || !elementsRef.current.links) return;
    const connected = getConnectedElements(selectedNodeIds, layoutData.edges);
    applySelectionStyles(
      elementsRef.current.circles, 
      elementsRef.current.links, 
      selectedNodeIds, 
      connected
    );
  }, [selectedNodeIds, layoutData.edges]);
};
