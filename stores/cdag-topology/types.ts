
/**
 * Types for the logical domain structural logic.
 * These represent the hierarchical truth of the Action Map.
 */

export type NodeType = 'action' | 'skill' | 'characteristic' | 'none';

export interface CdagNodeData {
  /** Map of parent labels to their weights in this relationship (0.1 to 1.0) */
  parents: Record<string, number>;
  /** Categorization of the node in the semantic hierarchy */
  type: NodeType;
}

/**
 * The logical "Source of Truth" for the hierarchy.
 * Keyed by normalized node label.
 */
export type CdagTopology = Record<string, CdagNodeData>;
