
/**
 * Types for the CDAG read-aside topology store.
 * Firebase is the source of truth; Zustand caches data only.
 */

export type NodeType = 'action' | 'skill' | 'characteristic' | 'none';

/**
 * NodeData: Individual node properties.
 */
export interface NodeData {
  /** Unique node identifier (slugified from label) */
  id: string;
  /** Human-readable node label */
  label: string;
  /** Semantic categorization of the node */
  type: NodeType;
  /** Extensible metadata for future use */
  metadata?: Record<string, unknown>;
  /** Timestamp of last modification (ISO8601) */
  createdAt?: string;
  updatedAt?: string;
}

/**
 * EdgeData: Relationship between two nodes.
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
 * GraphState: Normalized graph data (used by pure utilities).
 */
export interface GraphState {
  /** Lookup table: nodeId → NodeData (O(1) access) */
  nodes: Record<string, NodeData>;
  /** Lookup table: edgeId → EdgeData (O(1) access) */
  edges: Record<string, EdgeData>;
}

/**
 * Lightweight node summaries stored in the structure document.
 */
export interface CdagNodeSummary {
  id: string;
  label: string;
  type: NodeType;
}

/**
 * Structure document: adjacency + lightweight summaries for fast boot.
 */
export interface CdagStructure {
  adjacencyList: Record<string, string[]>;
  nodeSummaries: Record<string, CdagNodeSummary>;
  metrics: { nodeCount: number; edgeCount: number };
  lastUpdated?: string;
  version: number;
}

/**
 * Cache metadata for read-aside fetch decisions.
 */
export interface CdagCacheInfo {
  lastFetched: number;
  isDirty?: boolean;
}

/**
 * Cache metadata buckets for nodes, edges, and structure.
 */
export interface CdagMetadata {
  nodes: Record<string, CdagCacheInfo>;
  edges: Record<string, CdagCacheInfo>;
  structure: CdagCacheInfo;
  fullFetchAt: number; // Timestamp of last full fetch (used for cache invalidation) - metadata to track stale full-sync timing and updated docs to match the new policy
}

/**
 * Persisted CDAG store snapshot.
 */
export interface CdagStoreSnapshot {
  nodes: Record<string, NodeData>;
  edges: Record<string, EdgeData>;
  structure: CdagStructure;
  metadata: CdagMetadata;
}

