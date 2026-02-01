import { createJournalEntry } from '@/features/journal';
import { useAppDataStore } from '@/stores/app-data';
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
export const injectTestData = async (isAI: boolean) => {
  const entries = isAI ? AI_TEST_ENTRIES : MANUAL_TEST_ENTRIES;

  for (const e of entries) {
    const ctx = typeof e === 'string' 
      ? { entry: e, useAI: true } 
      : { entry: e.c, actions: e.a, useAI: false };
    
    await createJournalEntry(ctx);
    
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
export const injectTopologyData = async () => {
  const { getData, setData } = useAppDataStore.getState();
  const prev = getData();
  const nextAppData = {
    ...prev,
    cdagTopology: COMPLEX_TOPOLOGY_DATA
  };
  
  // Explicitly sync visualGraph metadata to reflect the new logical topology
  setData(syncGraphFromTopology(nextAppData));
};

/**
 * Injects the Brain CDAG topology directly.
 * 
 * Represents a complex personal development and cognitive skill tree.
 */
export const injectBrainTopologyData = async () => {
  const { getData, setData } = useAppDataStore.getState();
  const prev = getData();
  const nextAppData = {
    ...prev,
    cdagTopology: BRAIN_TOPOLOGY_DATA
  };
  
  // Explicitly sync visualGraph metadata to reflect the new logical topology
  setData(syncGraphFromTopology(nextAppData));
};
