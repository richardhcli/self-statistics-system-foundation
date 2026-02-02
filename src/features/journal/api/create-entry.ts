import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { useJournalActions } from '@/stores/journal';
import { JournalEntryData } from '@/types';
import { useEntryOrchestrator } from '@/hooks/use-entry-orchestrator';
import { useCallback } from 'react';

/**
 * Hook for creating journal entries
 * 
 * Provides a function to create journal entries with both AI and manual modes.
 * Creates loading placeholder immediately, then processes and updates the entry.
 * This prevents duplicate entries by ensuring consistent timestamp usage.
 * 
 * Usage:
 * const createEntry = useCreateJournalEntry();
 * await createEntry({ entry: "...", useAI: true, dateInfo: {...} });
 */
export const useCreateJournalEntry = () => {
  const journalActions = useJournalActions();
  const { applyEntryUpdates } = useEntryOrchestrator();

  const createJournalEntry = useCallback(
    async (context: { 
      entry: string; 
      actions?: string[]; 
      useAI?: boolean; 
      dateInfo?: any;
      duration?: string;
    }): Promise<void> => {
      const { entry, actions = [], useAI = false, dateInfo, duration } = context;
      
      // Generate normalized date ONCE to use for both loading and final entry
      const dateObj = getNormalizedDate(dateInfo);
      
      // Convert to date key string: YYYY/Month/DD/time
      const dateKey = `${dateObj.year}/${dateObj.month}/${dateObj.day}/${dateObj.time}`;

      const loadingEntry: JournalEntryData = {
        content: entry,
        duration: 'loading',
        actions: ['loading'],
        metadata: {
          totalExp: 0,
          levelsGained: 0,
          nodeIncreases: {}
        }
      };

      // Create loading placeholder at the normalized date
      journalActions.upsertEntry(dateKey, loadingEntry);

      // Process entry with orchestrator
      await applyEntryUpdates(dateKey, entry, { 
        actions, 
        useAI, 
        duration 
      });
    },
    [journalActions, applyEntryUpdates]
  );

  return createJournalEntry;
};