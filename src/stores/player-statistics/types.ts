
/**
 * Types for tracking user growth, experience, and node-level metrics.
 */

export interface NodeStats {
  experience: number;
  level: number;
}

/** Mapping of node labels to their current progress stats. */
export type PlayerStatistics = Record<string, NodeStats>;
