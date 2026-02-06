
import { CdagTopology, GraphState } from '@/stores/cdag-topology/types';
import { PlayerStatistics } from '../types';
import { calculateParentPropagation } from '@/lib/soulTopology';
import { parseDurationToMultiplier, scaleExperience } from './scaled-logic';
import { updatePlayerStatsState } from './exp-state-manager';

/**
 * Pure function: Calculate scaled progression from topology and actions.
 * This is a pure utility - does NOT access any stores.
 * 
 * @param topology - Current CDAG topology
 * @param stats - Current player statistics
 * @param initialActions - Action labels to propagate
 * @param duration - Duration string for scaling
 * @returns Updated stats and metadata
 */
export const calculateScaledProgression = (
  topology: CdagTopology,
  stats: PlayerStatistics,
  initialActions: string[],
  duration?: string
): {
  nextStats: PlayerStatistics;
  totalIncrease: number;
  levelsGained: number;
  nodeIncreases: Record<string, number>;
} => {
  const isGraphState = (value: CdagTopology): value is GraphState => {
    return Boolean((value as GraphState)?.nodes && (value as GraphState)?.edges);
  };

  const initialSeeds: Record<string, number> = {};
  initialActions.forEach((action) => {
    initialSeeds[action] = 1.0;
  });

  const propagated = isGraphState(topology)
    ? calculateParentPropagation(topology.nodes, topology.edges, initialSeeds)
    : calculateParentPropagation(topology, initialSeeds);

  const multiplier = parseDurationToMultiplier(duration);
  const scaledExpMap = scaleExperience(propagated, multiplier);

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    stats,
    scaledExpMap
  );

  return {
    nextStats,
    totalIncrease,
    levelsGained,
    nodeIncreases: scaledExpMap,
  };
};

/**
 * Pure function: Direct experience injection for debugging or specific triggers.
 * This is a pure utility - does NOT access any stores.
 * 
 * @param topology - Current CDAG topology
 * @param stats - Current player statistics
 * @param actions - Action labels
 * @param exp - Experience amount per action
 * @returns Updated stats and metadata
 */
export const calculateDirectProgression = (
  topology: CdagTopology,
  stats: PlayerStatistics,
  actions: string[],
  exp: number = 1
): {
  nextStats: PlayerStatistics;
  totalIncrease: number;
  levelsGained: number;
  nodeIncreases: Record<string, number>;
} => {
  const isGraphState = (value: CdagTopology): value is GraphState => {
    return Boolean((value as GraphState)?.nodes && (value as GraphState)?.edges);
  };

  const initialSeeds: Record<string, number> = {};
  actions.forEach((a) => (initialSeeds[a] = exp));

  const propagated = isGraphState(topology)
    ? calculateParentPropagation(topology.nodes, topology.edges, initialSeeds)
    : calculateParentPropagation(topology, initialSeeds);

  const { nextStats, totalIncrease, levelsGained } = updatePlayerStatsState(
    stats,
    propagated
  );

  return {
    nextStats,
    totalIncrease,
    levelsGained,
    nodeIncreases: propagated,
  };
};
