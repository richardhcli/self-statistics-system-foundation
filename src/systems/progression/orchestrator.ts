/**
 * Progression Orchestrator — Pure Calculation Pipelines
 *
 * Composes engine + formulas + state-mutations into high-level
 * "calculate everything" functions that the hook layer can call.
 *
 * These remain pure: take data in → return data out. No store access.
 *
 * @module @systems/progression/orchestrator
 */

import { NodeData, EdgeData } from '@/types';
import { calculateParentPropagation } from './engine';
import { parseDurationToMultiplier, scaleExperience } from './formulas';
import { updatePlayerStatsState, type PlayerStatistics } from './state-mutations';

/**
 * Calculate scaled EXP progression from topology seeds + duration.
 *
 * @param topology - `{ nodes, edges }` from the CDAG store.
 * @param stats    - Current player statistics snapshot.
 * @param actionWeights - Action label → seed weight map.
 * @param duration - Duration (minutes or string) for scaling.
 * @returns Next stats, deltas, and per-node EXP increases.
 */
export const calculateScaledProgression = (
  topology: { nodes: Record<string, NodeData>; edges: Record<string, EdgeData> },
  stats: PlayerStatistics,
  actionWeights: Record<string, number>,
  duration?: number | string,
): {
  nextStats: PlayerStatistics;
  totalIncrease: number;
  levelsGained: number;
  nodeIncreases: Record<string, number>;
} => {
  const propagated = calculateParentPropagation(
    topology.nodes,
    topology.edges,
    actionWeights,
  );

  const multiplier = parseDurationToMultiplier(duration);
  const scaledExpMap = scaleExperience(propagated, multiplier);

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    stats,
    scaledExpMap,
  );

  return { nextStats, totalIncrease, levelsGained, nodeIncreases: scaledExpMap };
};

/**
 * Direct EXP injection (debugging / manual triggers).
 * Skips duration scaling — useful for admin tools or test harnesses.
 *
 * @param topology - `{ nodes, edges }`.
 * @param stats    - Current player statistics snapshot.
 * @param actions  - Action labels (each seeded at `exp`).
 * @param exp      - EXP per action seed. Default `1`.
 */
export const calculateDirectProgression = (
  topology: { nodes: Record<string, NodeData>; edges: Record<string, EdgeData> },
  stats: PlayerStatistics,
  actions: string[],
  exp: number = 1,
): {
  nextStats: PlayerStatistics;
  totalIncrease: number;
  levelsGained: number;
  nodeIncreases: Record<string, number>;
} => {
  const initialSeeds: Record<string, number> = {};
  actions.forEach((a) => (initialSeeds[a] = exp));

  const propagated = calculateParentPropagation(
    topology.nodes,
    topology.edges,
    initialSeeds,
  );

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    stats,
    propagated,
  );

  return { nextStats, totalIncrease, levelsGained, nodeIncreases: propagated };
};
