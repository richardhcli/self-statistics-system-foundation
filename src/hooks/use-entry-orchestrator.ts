import { useCallback } from 'react';
import { useGraphNodes, useGraphEdges, useGraphActions } from '@/stores/cdag-topology';
import { usePlayerStatisticsActions } from '@/stores/player-statistics';
import { useUserInformationActions } from '@/stores/user-information';
import { useJournalActions } from '@/stores/journal';
import type { JournalEntryData } from '@/stores/journal';
import { calculateParentPropagation, analyzeEntry, transformActionsToTopology } from '@/lib/soulTopology';
import { parseDurationToMultiplier, scaleExperience } from '@/stores/player-statistics';
import type { GraphState } from '@/stores/cdag-topology';

/**
 * Entry Orchestrator Hook
 * 
 * Coordinates cross-store updates during journal entry processing.
 * Implements the Orchestrator pattern:
 * - Consumes multiple independent stores
 * - Applies business logic across store boundaries
 * - Dispatches sequential updates with React 18+ batching
 * 
 * Individual features should NEVER directly orchestrate cross-store logic. 
 * 
 * Usage:
 * const { applyEntryUpdates } = useEntryOrchestrator();
 * await applyEntryUpdates(entryId, entry, options);
 */
export const useEntryOrchestrator = () => {
  // Store action hooks (stable, won't cause re-renders)
  const journalActions = useJournalActions();
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
      entryId: string,
      entry: string,
      options: {
        actions?: string[];
        duration?: string;
        useAI?: boolean;
      }
    ): Promise<{ 
      totalExpIncrease: number; 
      levelsGained: number; 
      nodeIncreases: Record<string, number>;
      actions: Record<string, number>;
    }> => {
      const { actions = [], duration, useAI = false } = options;

      let topologyFragment: GraphState;
      let estimatedDuration = duration;
      let actionWeights: Record<string, number>;

      // Step 1: Generate or use provided topology fragment
      if (useAI) {
        const aiResult = await analyzeEntry(entry, { nodes, edges, version: 2 }, duration);
        topologyFragment = aiResult.topologyFragment;
        estimatedDuration = aiResult.estimatedDuration;
        actionWeights = aiResult.actionWeights; // Use AI-provided weights
      } else {
        // Manual mode: all actions have weight 1
        actionWeights = {};
        actions.forEach(action => {
          actionWeights[action] = 1;
        });
        topologyFragment = transformActionsToTopology(actions, { nodes, edges, version: 2 });
      }

      // Step 2: Merge topology fragment into store
      setGraph({
        nodes: { ...nodes, ...topologyFragment.nodes },
        edges: { ...edges, ...topologyFragment.edges },
        version: 2,
      });

      // Step 3: Calculate experience propagation from topology (use updated topology)
      // Use action weights as initial seeds
      const initialSeeds: Record<string, number> = { ...actionWeights };

      const mergedNodes = { ...nodes, ...topologyFragment.nodes };
      const mergedEdges = { ...edges, ...topologyFragment.edges };
      const propagated = calculateParentPropagation(mergedNodes, mergedEdges, initialSeeds);

      // Step 4: Scale based on duration
      const multiplier = parseDurationToMultiplier(estimatedDuration);
      const scaledExpMap = scaleExperience(propagated, multiplier);

      // Step 5: Update player statistics and get results
      const { totalIncrease, levelsGained } = updateStats(scaledExpMap);

      // Step 6: Update user's most recent action
      const actionNames = Object.keys(actionWeights);
      if (actionNames.length > 0) {
        updateMostRecentAction(actionNames[0]);
      }

      // Step 7: Create and upsert journal entry with new schema
      const parsedDuration = estimatedDuration ? Number.parseFloat(estimatedDuration) : undefined;

      const entryData: JournalEntryData = {
        id: entryId,
        content: entry,
        status: 'COMPLETED',
        actions: actionWeights,
        result: {
          levelsGained,
          totalExpIncrease: totalIncrease,
          nodeIncreases: scaledExpMap,
        },
        metadata: {
          flags: { aiAnalyzed: useAI },
          timePosted: new Date().toISOString(),
          duration: Number.isFinite(parsedDuration) ? parsedDuration : undefined,
        },
      };

      journalActions.upsertEntry(entryId, entryData);

      return { 
        totalExpIncrease: totalIncrease, 
        levelsGained, 
        nodeIncreases: scaledExpMap,
        actions: actionWeights,
      };
    },
    [nodes, edges, journalActions, updateStats, updateMostRecentAction, setGraph]
  );

  return {
    applyEntryUpdates,
  };
};
