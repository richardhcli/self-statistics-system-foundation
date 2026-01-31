import { createJournalEntry } from '@/features/journal';
import { AppData } from '@/types';
import { syncGraphFromTopology } from '@/hooks/sync-graph-from-topology';
import { 
  AI_TEST_ENTRIES, 
  MANUAL_TEST_ENTRIES, 
  COMPLEX_TOPOLOGY_DATA,
  BRAIN_TOPOLOGY_DATA
} from '@/testing';

/**
 * API for injecting mock datasets into the application for testing.
 * 
 * Functional Description:
 * Orchestrates the batch creation of journal entries.
 * - AI Injections: Passes raw strings to the Gemini-powered pipeline.
 * - Manual Injections: Directly tags entries with pre-defined actions.
 */
// Add data: AppData parameter to satisfy createJournalEntry requirements
export const injectTestData = async (data: AppData, setData: any, isAI: boolean) => {
  const entries = isAI ? AI_TEST_ENTRIES : MANUAL_TEST_ENTRIES;

  for (const e of entries) {
    const ctx = typeof e === 'string' 
      ? { entry: e, useAI: true } 
      : { entry: e.c, actions: e.a, useAI: false };
    
    // Pass current data as the third argument to satisfy createJournalEntry requirements
    await createJournalEntry(ctx, setData, data);
    
    // Staggered delay ensures that generated timestamps are unique 
    // at the millisecond level for IndexedDB key safety.
    await new Promise(r => setTimeout(r, 350));
  }
};

/**
 * Injects a complex CDAG topology directly.
 * 
 * Useful for verifying graph visualization stability and 
 * multi-path experience propagation logic.
 */
export const injectTopologyData = async (setData: (fn: (prev: AppData) => AppData) => void) => {
  setData(prev => {
    const nextAppData: AppData = {
      ...prev,
      cdagTopology: COMPLEX_TOPOLOGY_DATA
    };
    
    // Explicitly sync visualGraph metadata to reflect the new logical topology
    return syncGraphFromTopology(nextAppData);
  });
};

/**
 * Injects the Brain CDAG topology directly.
 * 
 * Represents a complex personal development and cognitive skill tree.
 */
export const injectBrainTopologyData = async (setData: (fn: (prev: AppData) => AppData) => void) => {
  setData(prev => {
    const nextAppData: AppData = {
      ...prev,
      cdagTopology: BRAIN_TOPOLOGY_DATA
    };
    
    // Explicitly sync visualGraph metadata to reflect the new logical topology
    return syncGraphFromTopology(nextAppData);
  });
};
