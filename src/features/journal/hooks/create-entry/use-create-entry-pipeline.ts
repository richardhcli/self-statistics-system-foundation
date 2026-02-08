import { useCallback } from 'react';
import { useCreateDummyEntry } from './use-create-dummy-entry';
import { useAddTranscriptionToEntry } from './use-add-transcription-to-entry';
import { useAnalyzeEntryWithAI } from './use-analyze-entry-with-ai';
import { useJournalActions } from '@/stores/journal';
import { generateEntryId } from '@/features/journal/utils/id-generator';
import type { JournalEntryData } from '@/stores/journal';

/**
 * Orchestrator hook for the complete entry creation pipeline
 * 
 * Coordinates the three-stage entry creation flow supporting both voice and manual input:
 * 1. Create dummy entry (immediate placeholder or actual content)
 * 2. Add transcribed/typed text (update content after transcription or validation)
 * 3. Analyze with AI (process entry for actions/skills/characteristics)
 * 
 * **Hybrid Progressive Strategy:**
 * - Voice flow: Dummy shows "🎤 Transcribing..." → Transcription replaces text → AI processes
 * - Manual flow: Dummy shows user's text → Skip Stage 2 internally → AI processes immediately
 * - Both flows converge after transcription is complete (content matches final submission)
 * 
 * **Entry ID Format:**
 * Uses generateEntryId() for sortable IDs: "YYYYMMDD-HHmmss-xxxx"
 * 
 * **Duration Storage:**
 * Duration parameter is stored in Stage 1 metadata, available immediately for AI processing.
 * Optional and flexible - most entries will have empty duration, filled in later stages if needed.
 * 
 * **Flexible Dummy Content:**
 * - Voice: Placeholder text "🎤 Transcribing..." shown to user during processing
 * - Manual: User's actual text (dummy display suppressed by parent)
 * - Custom: Any string accepted for extensibility
 * 
 * This pattern provides progressive feedback without blocking the UI, while supporting
 * both immediate entry creation (manual) and asynchronous processing (voice).
 * 
 * @returns {Object} Pipeline object with staged creation methods
 *   - createDummyEntry(content?, duration?, dateInfo?): Creates placeholder, returns entryId
 *   - updateWithTranscription(entryId, text): Replaces dummy content with transcribed text
 *   - updateWithAIAnalysis(entryId, content): Triggers AI processing for full entry enrichment
 * 
 * @example
 * // Voice flow: Progressive with placeholder
 * const { createDummyEntry, updateWithTranscription, updateWithAIAnalysis } 
 *   = useCreateEntryPipeline();
 * 
 * // Stage 1: Create with placeholder (shown to user while waiting)
 * const entryId = createDummyEntry('🎤 Transcribing...', '60');
 * 
 * // Stage 2: Replace placeholder with transcribed text
 * const transcription = await transcribeAudio(audioBlob);
 * updateWithTranscription(entryId, transcription);
 * 
 * // Stage 3: Trigger AI to populate actions/skills/characteristics
 * await updateWithAIAnalysis(entryId, transcription);
 * 
 * @example
 * // Manual flow: Hybrid - content already filled, progress internally
 * const entryId = createDummyEntry('I just debugged the API', '30');
 * // Parent suppresses dummy display; content already correct
 * await updateWithAIAnalysis(entryId, 'I just debugged the API');  // AI processes immediately
 */
export const useCreateEntryPipeline = () => {
  const createDummyEntry = useCreateDummyEntry();
  const addTranscriptionToEntry = useAddTranscriptionToEntry();
  const analyzeEntryWithAI = useAnalyzeEntryWithAI();
  const journalActions = useJournalActions();

  /**
   * Stage 1: Create dummy entry with flexible content and optional duration.
   * Returns entry ID immediately for use in Stages 2 & 3.
   * 
   * @param dummyContent - Content to display: "🎤 Transcribing..." or user text
   * @param duration - Optional duration for AI context (e.g., "45 mins")
   * @returns Entry ID in format "YYYYMMDD-HHmmss-xxxx"
   */
  const createDummyEntryStage = useCallback(
    (dummyContent?: string, duration?: string): string => {
      return createDummyEntry(dummyContent, duration);
    },
    [createDummyEntry]
  );

  /**
   * Stage 2: Update entry with transcribed/typed text.
   * Replaces dummy content with actual text from transcription or user submission.
   * 
   * @param entryId - Entry ID from Stage 1
   * @param text - Transcribed or typed text
   */
  const updateWithTranscription = useCallback(
    (entryId: string, text: string): void => {
      addTranscriptionToEntry(entryId, text);
    },
    [addTranscriptionToEntry]
  );

  /**
   * Stage 3: Trigger AI analysis for full entry enrichment.
   * Processes entry content to extract actions, skills, characteristics, etc.
   * 
   * @param entryId - Entry ID from Stage 1
   * @param content - Content to analyze (should match final text from Stage 2)
   */
  const updateWithAIAnalysis = useCallback(
    async (entryId: string, content: string): Promise<void> => {
      await analyzeEntryWithAI(entryId, content);
    },
    [analyzeEntryWithAI]
  );

  /**
   * Complete Entry Creation (Merged from create-entry.ts)
   * 
   * Creates a full journal entry with both AI and manual modes.
   * Creates loading placeholder immediately, then processes and updates the entry.
   * This prevents duplicate entries by ensuring consistent timestamp usage.
   * 
   * **Flow:**
   * 1. Generate normalized date once (ensures consistency)
   * 2. Create loading placeholder with that date
   * 3. Apply entry updates through orchestrator
   * 
   * Usage:
   * const createEntry = useCreateJournalEntry();
   * await createEntry({ entry: "...", useAI: true, dateInfo: {...} });
   * 
   * @param context - Entry context with content, flags, and optional date/duration
   */
  const useCreateJournalEntry = useCallback(
    async (context: {
      entry: string;
      actions?: string[];
      useAI?: boolean;
      dateInfo?: any;
      duration?: string;
    }): Promise<void> => {
      const { entry, actions = [], useAI = false, duration } = context;
      const entryId = generateEntryId();
      const parsedDuration = duration ? Number.parseFloat(duration) : undefined;

      const loadingEntry: JournalEntryData = {
        id: entryId,
        content: entry,
        status: useAI ? 'ANALYZING' : 'DRAFT',
        actions: actions.length ? Object.fromEntries(actions.map((action) => [action, 1])) : {},
        metadata: {
          flags: { aiAnalyzed: false },
          timePosted: new Date().toISOString(),
          duration: Number.isFinite(parsedDuration) ? parsedDuration : undefined,
        },
      };

      journalActions.optimisticAdd(loadingEntry);
      await analyzeEntryWithAI(entryId, entry);
    },
    [journalActions, analyzeEntryWithAI]
  );

  return {
    createDummyEntry: createDummyEntryStage,
    updateWithTranscription,
    updateWithAIAnalysis,
    useCreateJournalEntry, // New: merged from create-entry.ts
  };
};
