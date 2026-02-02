import { useCallback } from 'react';
import { useGraphNodes, useGraphEdges, useGraphActions } from '@/stores/cdag-topology';
import { usePlayerStatisticsActions } from '@/stores/player-statistics';
import { useUserInformationActions } from '@/stores/user-information';
import { useJournalActions } from '@/stores/journal';
import { JournalEntryData } from '@/stores/journal';
import { calculateParentPropagation } from '@/lib/soulTopology';
import { parseDurationToMultiplier, scaleExperience } from '@/stores/player-statistics';
import { aiEntryAnalyzer } from '@/utils/text-to-topology/ai-entry-analyzer';
import { buildIncomingTopologyFromActions } from '@/utils/text-to-topology/build-incoming-topology-from-actions';
import type { GraphState } from '@/stores/cdag-topology';

/**
 * Entry Orchestrator Hook
 * 
 * Coordinates cross-store updates during journal entry processing.
 * Implements the Orchestrator pattern (Pattern B/C hybrid):
 * - Consumes multiple independent stores
 * - Applies business logic across store boundaries
 * - Dispatches sequential updates with React 18+ batching
 * 
 * This is the ONLY hook that should coordinate multiple stores.
 * Individual features should NEVER directly orchestrate cross-store logic.
 * 
 * Usage:
 * const { applyEntryUpdates } = useEntryOrchestrator();
 * await applyEntryUpdates(dateKey, entry, options);
 */
export const useEntryOrchestrator = () => {
  // Store action hooks (stable, won't cause re-renders)
  const { upsertEntry } = useJournalActions();
  const { updateStats } = usePlayerStatisticsActions();
  const { updateMostRecentAction } = useUserInformationActions();
  const { addNode, addEdge, setGraph } = useGraphActions();
  
  // Store state selectors (only when needed for calculations)
  const nodes = useGraphNodes();
  const edges = useGraphEdges();

  /**
   * Apply coordinated updates across journal, stats, topology, and user info stores.
   * All updates are batched by React 18+ for single re-render.
   * 
   * Supports both AI and manual entry modes:
   * - AI mode: Analyzes entry text to extract actions, skills, and characteristics
   * - Manual mode: Uses provided actions array
   */
  const applyEntryUpdates = useCallback(
    async (
      dateKey: string,
      entry: string,
      options: {
        actions?: string[];
        duration?: string;
        useAI?: boolean;
      }
    ): Promise<{ 
      totalIncrease: number; 
      levelsGained: number; 
      nodeIncreases: Record<string, number>;
      actions: string[];
    }> => {
      const { actions = [], duration, useAI = false } = options;

      let topologyFragment: GraphState;
      let estimatedDuration = duration;
      let finalActions = actions;

      // Step 1: Generate or use provided topology fragment
      if (useAI) {
        const aiResult = await aiEntryAnalyzer(entry, { nodes, edges }, duration);
        topologyFragment = aiResult.cdagTopologyFragment;
        estimatedDuration = aiResult.estimatedDuration;
        
        // Extract actions from topology fragment (action nodes are those with incoming edges)
        finalActions = Object.keys(topologyFragment.nodes).filter(
          id => topologyFragment.nodes[id].type === 'none' || 
                Object.values(topologyFragment.edges).some(e => e.target === id)
        );
      } else {
        topologyFragment = buildIncomingTopologyFromActions(actions, { nodes, edges });
        finalActions = actions;
      }

      // Step 2: Merge topology fragment into store
      setGraph({
        nodes: { ...nodes, ...topologyFragment.nodes },
        edges: { ...edges, ...topologyFragment.edges },
        version: 2,
      });

      // Step 3: Calculate experience propagation from topology (use updated topology)
      const initialSeeds: Record<string, number> = {};
      finalActions.forEach((action) => {
        initialSeeds[action] = 1.0;
      });

      const propagated = calculateParentPropagation({ ...nodes, ...topologyFragment.nodes }, initialSeeds);

      // Step 4: Scale based on duration
      const multiplier = parseDurationToMultiplier(estimatedDuration);
      const scaledExpMap = scaleExperience(propagated, multiplier);

      // Step 5: Update player statistics and get results
      const { totalIncrease, levelsGained } = updateStats(scaledExpMap);

      // Step 6: Update user's most recent action
      if (finalActions.length > 0) {
        updateMostRecentAction(finalActions[0]);
      }

      // Step 7: Create and upsert journal entry
      const entryData: JournalEntryData = {
        content: entry,
        duration: estimatedDuration,
        actions: finalActions.length > 0 ? finalActions : undefined,
        metadata: {
          totalExp: totalIncrease,
          levelsGained,
          nodeIncreases: scaledExpMap,
        },
      };

      upsertEntry(dateKey, entryData);

      return { 
        totalIncrease, 
        levelsGained, 
        nodeIncreases: scaledExpMap,
        actions: finalActions,
      };
    },
    [nodes, edges, updateStats, updateMostRecentAction, upsertEntry, setGraph]
  );

  return {
    applyEntryUpdates,
  };
};
