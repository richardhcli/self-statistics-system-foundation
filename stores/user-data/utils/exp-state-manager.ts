
import { PlayerStatistics, NodeStats } from '../types';

const LVL_THRESHOLD = 10;

/**
 * Handles application of EXP to the global state object.
 */
export const updatePlayerStatsState = (
  currentStats: PlayerStatistics,
  expIncreases: Record<string, number>
): { nextStats: PlayerStatistics; totalIncrease: number; levelsGained: number } => {
  const nextStats: PlayerStatistics = { ...currentStats };
  let totalIncrease = 0;
  let levelsGained = 0;

  Object.entries(expIncreases).forEach(([label, amount]) => {
    if (amount <= 0) return;

    totalIncrease += amount;
    
    const node: NodeStats = nextStats[label] || { experience: 0, level: 1 };
    const nextExp = node.experience + amount;
    const nextLevel = Math.floor(nextExp / LVL_THRESHOLD) + 1;
    
    if (nextLevel > node.level) {
      levelsGained += (nextLevel - node.level);
    }
    
    nextStats[label] = { experience: nextExp, level: nextLevel };
  });

  return { nextStats, totalIncrease, levelsGained };
};
