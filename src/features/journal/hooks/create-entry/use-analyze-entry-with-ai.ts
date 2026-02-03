import { useCallback } from 'react';
import { useEntryOrchestrator } from '@/hooks/use-entry-orchestrator';

/**
 * Hook for triggering AI analysis on an existing journal entry
 * 
 * Takes an entry that already has transcribed content and runs it
 * through the full AI analysis pipeline (actions, skills, characteristics, etc.)
 * 
 * @returns {Function} analyzeEntryWithAI - Triggers AI analysis on entry by ID
 * 
 * @example
 * const analyzeEntryWithAI = useAnalyzeEntryWithAI();
 * await analyzeEntryWithAI("2026/02/03/14:30", "I debugged for 2 hours");
 */
export const useAnalyzeEntryWithAI = () => {
  const { applyEntryUpdates } = useEntryOrchestrator();

  const analyzeEntryWithAI = useCallback(
    async (entryId: string, entryContent: string): Promise<void> => {
      // Trigger full AI analysis pipeline on the entry
      await applyEntryUpdates(entryId, entryContent, {
        useAI: true,
      });
    },
    [applyEntryUpdates]
  );

  return analyzeEntryWithAI;
};
