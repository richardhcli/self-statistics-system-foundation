
/**
 * Types for the local-first graph store.
 * Flat, normalized schema for O(1) lookups and reference-stable updates.
 */

export type NodeType = 'action' | 'skill' | 'characteristic' | 'none';

/**
 * NodeData: Individual node properties
 * Does NOT include hierarchy depth (level is computed if needed for UI layout)
 * Does NOT include visual positions (stored separately in visual-graph feature)
 */
export interface NodeData {
  /** Unique node identifier (slugified from label) */
  id: string;
  /** Human-readable node label */
  label: string;
  /** Semantic categorization of the node */
  type: NodeType;
  /** Extensible metadata for future use */
  metadata?: Record<string, any>;
  /** Timestamp of last modification (ISO8601) */
  createdAt?: string;
  updatedAt?: string;
}

/**
 * EdgeData: Relationship between two nodes
 * References nodes by ID, enabling O(1) lookups
 */
export interface EdgeData {
  /** Unique edge identifier */
  id: string;
  /** Source node ID (parent in hierarchy) */
  source: string;
  /** Target node ID (child in hierarchy) */
  target: string;
  /** Edge weight/strength (0.1 to 1.0, affects progression) */
  weight?: number;
  /** Optional edge label (e.g., "depends-on", "reinforces") */
  label?: string;
  /** Timestamp of last modification (ISO8601) */
  createdAt?: string;
  updatedAt?: string;
}

/**
 * GraphState: The complete graph structure
 * Stored in Zustand + IndexedDB with idb-keyval persistence
 */
export interface GraphState {
  /** Lookup table: nodeId → NodeData (O(1) access) */
  nodes: Record<string, NodeData>;
  /** Lookup table: edgeId → EdgeData (O(1) access) */
  edges: Record<string, EdgeData>;
  /** Schema version for migrations */
  version: number;
  /** Last sync timestamp (for server comparison) */
  lastSyncTimestamp?: string;
}

/**
 * Legacy type for migration compatibility
 * @deprecated Use NodeData + EdgeData instead
 */
export interface CdagNodeData {
  parents: Record<string, number>;
  type: NodeType;
}

/**
 * Legacy type for migration compatibility
 * @deprecated Use GraphState instead
 */
export type CdagTopology = Record<string, CdagNodeData>;

