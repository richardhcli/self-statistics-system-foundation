
import { AppData } from '@/types';
import { calculateParentPropagation } from '@/stores/cdag-topology';
import { parseDurationToMultiplier, scaleExperience } from './scaled-logic';
import { updatePlayerStatsState } from './exp-state-manager';

/**
 * Orchestrates the full EXP calculation and application flow.
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
