import { useCreateJournalEntry } from '@/features/journal/api/create-entry';
import { useCdagTopologyActions } from '@/stores/cdag-topology';
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
 * 
 * NOTE: This is designed to be called from a React component context
 * where hooks can be used. See DebugView for usage example.
 */
export const createInjectTestDataHook = () => {
  return async (isAI: boolean) => {
    const createEntry = useCreateJournalEntry();
    const entries = isAI ? AI_TEST_ENTRIES : MANUAL_TEST_ENTRIES;

    for (const e of entries) {
      const ctx = typeof e === 'string' 
        ? { entry: e, useAI: true } 
        : { entry: e.c, actions: e.a, useAI: false };
      
      await createEntry(ctx);
      
      // Staggered delay ensures that generated timestamps are unique 
      // at the millisecond level for IndexedDB key safety.
      await new Promise(r => setTimeout(r, 350));
    }
  };
};

/**
 * Injects a complex CDAG topology directly.
 * 
 * Useful for verifying graph visualization stability and 
 * multi-path experience propagation logic.
 * 
 * NOTE: This must be called from a React component context.
 */
export const createInjectTopologyDataHook = () => {
  return () => {
    const { setTopology } = useCdagTopologyActions();
    setTopology(COMPLEX_TOPOLOGY_DATA);
  };
};

/**
 * Injects the Brain CDAG topology directly.
 * 
 * Represents a complex personal development and cognitive skill tree.
 */
export const createInjectBrainTopologyDataHook = () => {
  return () => {
    const { setTopology } = useCdagTopologyActions();
    setTopology(BRAIN_TOPOLOGY_DATA);
  };
};
