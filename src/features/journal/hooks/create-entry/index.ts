/**
 * Entry Creation Pipeline - Main Export
 * 
 * Aggregates all entry creation utilities for bulletproof react organization.
 * Use specific hooks for fine-grained control, or use the pipeline orchestrator
 * for the full progressive entry creation flow.
 * 
 * **Unified API:**
 * - useCreateEntryPipeline() - Returns pipeline with all 3 stages + useCreateJournalEntry
 * - useCreateJournalEntry() - Merged complete entry creation (legacy create-entry.ts)
 */

export { useCreateDummyEntry } from './use-create-dummy-entry';
export { useAddTranscriptionToEntry } from './use-add-transcription-to-entry';
export { useAnalyzeEntryWithAI } from './use-analyze-entry-with-ai';
export { useCreateEntryPipeline } from './use-create-entry-pipeline';

// Re-export useCreateJournalEntry for backward compatibility
// Previously in create-entry.ts, now merged into use-create-entry-pipeline.ts
import { useCreateEntryPipeline } from './use-create-entry-pipeline';

export const useCreateJournalEntry = () => {
  const pipeline = useCreateEntryPipeline();
  return pipeline.useCreateJournalEntry;
};
