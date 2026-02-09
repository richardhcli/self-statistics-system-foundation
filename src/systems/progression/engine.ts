/**
 * Progression Engine — Path-Weighted Cumulative Averaging
 *
 * Pure, deterministic graph algorithm that propagates experience seeds
 * upward through a CDAG (Concept Directed Acyclic Graph).
 *
 * DESIGN PHILOSOPHY:
 * A single task (Action) can influence multiple branches. For instance,
 * "Writing a Technical Blog" might contribute to both "Coding" and "Writing".
 * Simply summing contributions at the Domain level causes exponential inflation.
 * This algorithm treats each seed as a discrete unit of effort and calculates
 * the mean intensity across all inheritance paths.
 *
 * ALGORITHM:
 * 1. For each initial seed (Action):
 *    - BFS traversal upward through the topology.
 *    - Maintain a pathWeight that decays based on edge proportions.
 *    - Accumulate weighted seed value; increment hit counter per ancestor.
 * 2. Normalize accumulated sums by hit counts (Path-Averaging).
 *
 * No React, no stores, no side-effects — unit-testable in isolation.
 *
 * @module @systems/progression/engine
 */

import { NodeData, EdgeData } from '@/types';
import { EXP_PRECISION } from './constants';

/** Round a number to the configured EXP decimal precision. */
const roundExp = (n: number): number =>
  Math.round(n * 10 ** EXP_PRECISION) / 10 ** EXP_PRECISION;

/**
 * Build a lookup of `childId → { parentId: edgeWeight }` from the edge table.
 * Used internally by the propagation BFS.
 */
const buildParentMap = (
  nodes: Record<string, NodeData>,
  edges: Record<string, EdgeData>,
): Record<string, Record<string, number>> => {
  const parentMap: Record<string, Record<string, number>> = {};

  Object.keys(nodes).forEach((nodeId) => {
    parentMap[nodeId] = {};
  });

  Object.values(edges).forEach((edge) => {
    if (!parentMap[edge.target]) {
      parentMap[edge.target] = {};
    }
    parentMap[edge.target][edge.source] = edge.weight || 1.0;
  });

  return parentMap;
};

/**
 * Calculate experience propagation using Path-Weighted Cumulative Averaging.
 *
 * @param nodes  - Node lookup table from GraphState.
 * @param edges  - Edge lookup table from GraphState.
 * @param initialValues - Seed EXP values keyed by action node label.
 * @returns Map of every reachable node → its propagated EXP (rounded to {@link EXP_PRECISION} dp).
 */
export const calculateParentPropagation = (
  nodes: Record<string, NodeData>,
  edges: Record<string, EdgeData>,
  initialValues: Record<string, number>,
): Record<string, number> => {
  const parentMap = buildParentMap(nodes, edges);

  const accumulatedSum: Record<string, number> = {};
  const contributionCount: Record<string, number> = {};

  Object.entries(initialValues).forEach(([actionLabel, seedValue]) => {
    const queue: { label: string; weight: number }[] = [
      { label: actionLabel, weight: 1.0 },
    ];

    while (queue.length > 0) {
      const { label, weight } = queue.shift()!;

      accumulatedSum[label] = (accumulatedSum[label] || 0) + seedValue * weight;
      contributionCount[label] = (contributionCount[label] || 0) + 1;

      const parents = parentMap[label] || {};
      Object.entries(parents).forEach(([parentLabel, edgeWeight]) => {
        queue.push({ label: parentLabel, weight: weight * edgeWeight });
      });
    }
  });

  /** Normalization: turn cumulative sum into mean intensity per node. */
  const result: Record<string, number> = {};
  Object.keys(accumulatedSum).forEach((label) => {
    const sum = accumulatedSum[label];
    const count = contributionCount[label];
    result[label] = count > 0 ? roundExp(sum / count) : 0;
  });

  return result;
};
