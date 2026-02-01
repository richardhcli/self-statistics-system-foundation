
import { AppData } from '@/types';
import { calculateParentPropagation } from '@/lib/soulTopology';
import { parseDurationToMultiplier, scaleExperience } from './scaled-logic';
import { updatePlayerStatsState } from './exp-state-manager';

/**
 * Orchestrates the full EXP calculation and application flow.
 * Links CDAG topology propagation with player statistics state updates.
 */
export const applyScaledProgression = (
  data: AppData,
  initialActions: string[],
  duration?: string
): { data: AppData; totalIncrease: number; levelsGained: number; nodeIncreases: Record<string, number> } => {
  const initialSeeds: Record<string, number> = {};
  initialActions.forEach(action => {
    initialSeeds[action] = 1.0;
  });

  const propagated = calculateParentPropagation(data.cdagTopology, initialSeeds);
  
  const multiplier = parseDurationToMultiplier(duration);
  const scaledExpMap = scaleExperience(propagated, multiplier);

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    data.playerStatistics,
    scaledExpMap
  );

  return {
    data: { ...data, playerStatistics: nextStats },
    totalIncrease,
    levelsGained,
    nodeIncreases: scaledExpMap
  };
};

/**
 * Direct experience injection for debugging or specific triggers.
 */
export const updatePlayerStats = (
  data: AppData, 
  actions: string[], 
  exp: number = 1
): { data: AppData; totalIncrease: number; levelsGained: number; nodeIncreases: Record<string, number> } => {
  const initialSeeds: Record<string, number> = {};
  actions.forEach(a => initialSeeds[a] = exp);
  
  const propagated = calculateParentPropagation(data.cdagTopology, initialSeeds);
  
  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    data.playerStatistics,
    propagated
  );

  return { 
    data: { ...data, playerStatistics: nextStats },
    totalIncrease,
    levelsGained,
    nodeIncreases: propagated
  };
};
