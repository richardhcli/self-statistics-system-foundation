
// Fix: Use namespace import for D3 to ensure consistent access across different environments
import * as d3 from 'd3';
import { LayoutNode } from '../hooks/use-dag-layout';

/**
 * Configures the "Ultra-Rigid Snapping" drag behavior for graph nodes.
 */
export const createDragBehavior = (
  simulation: any, // Fix: Use any for Simulation type
  nodes: LayoutNode[],
  onUpdate: () => void
) => {
  // Fix: Use (d3 as any).drag() and any-casting for event types
  function dragStarted(this: any, event: any, d: LayoutNode) {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    d.fx = d.x;
    d.fy = d.y;
    (d3 as any).select(this).attr("cursor", "grabbing");
  }

  function dragged(event: any, d: LayoutNode) {
    d.fx = event.x;
    d.fy = event.y;

    // Trigger visual update immediately so edges follow the mouse
    onUpdate();

    // Reorder swap logic: If we drag a node vertically near a neighbor, swap their slots
    const neighbors = nodes.filter(n => n.rank === d.rank && n.id !== d.id);
    neighbors.forEach(n => {
      const dy = Math.abs(event.y - n.targetY);
      // Snapping threshold for rank swapping
      if (dy < 40) {
        const tempIdx = d.indexInRank;
        d.indexInRank = n.indexInRank;
        n.indexInRank = tempIdx;
        
        // Recalculate target positions for the rank to reflect the swap
        const rankNodes = nodes.filter(rn => rn.rank === d.rank).sort((a, b) => a.indexInRank - b.indexInRank);
        rankNodes.forEach((rn, idx) => {
           // We keep the logic simple here, the use-dag-layout will handle the full centering
           // but we update targetY for immediate rigid feedback
           const count = rankNodes.length;
           const VERTICAL_GAP = 120;
           const height = 700; 
           rn.targetY = (height / 2) - ((count - 1) * VERTICAL_GAP / 2) + (idx * VERTICAL_GAP);
        });

        // Minor heat boost to let nodes settle into new swaps
        simulation.alpha(0.05).restart();
      }
    });
  }

  function dragEnded(this: any, event: any, d: LayoutNode) {
    if (!event.active) simulation.alphaTarget(0);
    d.fx = null;
    d.fy = null;
    
    // ULTRA-RIGID SNAP: Force exact mathematical alignment on release
    // If dropped within 150px of target slot, teleport to exact coordinate
    const dist = Math.sqrt(Math.pow(d.x! - d.targetX, 2) + Math.pow(d.y! - d.targetY, 2));
    if (dist < 150) {
      d.x = d.targetX;
      d.y = d.targetY;
    }

    (d3 as any).select(this).attr("cursor", "grab");
    
    // Ensure final position is reflected in line positions
    onUpdate();
    
    // High heat restart to trigger final rigid snapping logic in tick handler
    simulation.alpha(1).restart();
  }

  return (d3 as any).drag()
    .on("start", dragStarted)
    .on("drag", dragged)
    .on("end", dragEnded);
};

/**
 * Configures the zoom and pan behavior for the SVG container.
 */
export const createZoomBehavior = (containerGroup: any) => {
  // Fix: Use (d3 as any).zoom()
  return (d3 as any).zoom()
    .scaleExtent([0.1, 4])
    .on("zoom", (event: any) => {
      containerGroup.attr("transform", event.transform.toString());
    });
};
