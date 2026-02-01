
import { NodeType } from '@/stores/cdag-topology/types';

/**
 * Types specifically for the D3-based graph visualization.
 * This is purely view-state and does not dictate the logical hierarchy.
 */

export interface GraphNode {
  /** Unique identifier (slugified label) */
  id: string;
  /** Display label */
  label: string;
  /** Depth in the CDAG hierarchy (0 = root) */
  level: number;
  /** Categorization for visual encoding */
  type: NodeType;
  /** D3 Force Simulation coordinate */
  x?: number;
  /** D3 Force Simulation coordinate */
  y?: number;
  /** Fixed position (used for dragging) */
  fx?: number | null;
  /** Fixed position (used for dragging) */
  fy?: number | null;
}

export interface GraphEdge {
  /** Unique identifier for the edge */
  id: string;
  /** ID of the source node */
  source: string;
  /** ID of the target node */
  target: string;
  /** Optional edge label */
  label?: string;
  /** Relative importance or weight of the connection */
  proportion: number;
}

/**
 * Visual metadata store for D3 simulation.
 * This is the object stored in the "VisualGraph" IndexedDB table.
 */
export interface VisualGraph {
  /** Current list of active nodes */
  nodes: GraphNode[];
  /** Connections between nodes */
  edges: GraphEdge[];
}
