/**
 * Progression State Mutations
 *
 * Pure functions that take current player statistics + EXP deltas
 * and return the next immutable state. No store access, no side-effects.
 *
 * @module @systems/progression/state-mutations
 */

import { getLevelForExp } from './formulas';
import { roundExp } from './formulas';

/** Per-node experience and level snapshot. */
export interface NodeStats {
  experience: number;
  level: number;
}

/** Map of node labels → their current stats. */
export type PlayerStatistics = Record<string, NodeStats>;

/**
 * Apply EXP increases to player statistics and detect level-ups.
 *
 * @param currentStats  - Current immutable stats snapshot.
 * @param expIncreases  - Node label → EXP to add.
 * @returns New stats object, total EXP gained, and levels gained.
 */
export const updatePlayerStatsState = (
  currentStats: PlayerStatistics,
  expIncreases: Record<string, number>,
): { nextStats: PlayerStatistics; totalIncrease: number; levelsGained: number } => {
  const nextStats: PlayerStatistics = { ...currentStats };
  let totalIncrease = 0;
  let levelsGained = 0;

  Object.entries(expIncreases).forEach(([label, amount]) => {
    if (amount <= 0) return;

    totalIncrease += amount;

    const node: NodeStats = nextStats[label] || { experience: 0, level: 0 };
    const nextExp = roundExp(node.experience + amount);
    const nextLevel = getLevelForExp(nextExp);

    if (nextLevel > node.level) {
      levelsGained += nextLevel - node.level;
    }

    nextStats[label] = { experience: nextExp, level: nextLevel };
  });

  return { nextStats, totalIncrease: roundExp(totalIncrease), levelsGained };
};
