
// Fix: Namespace import for D3 to fix missing type and member errors
import * as d3 from 'd3';
import { EDGE_COLORS } from './graph-styles';

/**
 * Initializes SVG markers (arrowheads) for directed edges.
 */
export const initializeMarkers = (svg: any) => {
  const defs = svg.append("defs");
  
  /**
   * Arrowhead Configuration:
   * - Node Radius: 25px (Size/Diameter: 50px)
   * - Target Tip Size: 12.5px (25% of Node Size)
   * - ViewBox: 0 to 10 units. Tip is at x=10.
   * - Scale: 12.5px / 10 units = 1.25px per unit.
   * - Goal: Tip (x=10) should be 25px away from path end (node center).
   * - Calculation: (refX - 10) * 1.25 = 25  => refX - 10 = 20 => refX = 30.
   */
  defs.append("marker")
    .attr("id", "arrowhead")
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", 30) 
    .attr("refY", 0)
    .attr("orient", "auto")
    .attr("markerWidth", 12.5) 
    .attr("markerHeight", 12.5)
    .attr("markerUnits", "userSpaceOnUse") 
    .append("path")
    .attr("d", "M 0,-5 L 10,0 L 0,5")
    .attr("fill", EDGE_COLORS.end) // Matches the new "Dark Gray" end of the scale
    .attr("stroke", "none");

  return defs;
};
