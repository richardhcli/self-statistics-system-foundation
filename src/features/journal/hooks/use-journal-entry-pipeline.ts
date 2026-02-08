/**
 * Unified journal entry orchestrator.
 * Implements Draft -> Transcribe -> Analyze with Firebase read-aside writes.
 */

import { useCallback } from 'react';
import { arrayUnion, increment } from 'firebase/firestore';
import { transcribeWebmAudio } from '@/lib/google-ai';
import {
  createEntryBatch,
  incrementTreeTotals,
  updateJournalEntry,
} from '@/lib/firebase/journal';
import { auth } from '@/lib/firebase/services';
import { useEntryOrchestrator } from '@/hooks/use-entry-orchestrator';
import { generateEntryId, getDateFromId } from '../utils/id-generator';
import { useJournalActions, useJournalEntries, useJournalTree } from '@/stores/journal';
import type { JournalEntryData } from '@/stores/journal';

const toDateParts = (date: Date) => {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return { year, month, day };
};

const requireUserId = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error('Journal entry pipeline requires an authenticated user');
  }
  return uid;
};

const parseDuration = (duration?: string): number | undefined => {
  if (!duration) return undefined;
  const parsed = Number.parseFloat(duration);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const buildDraftEntry = (
  entryId: string,
  content: string,
  status: JournalEntryData['status'],
  duration?: string
): JournalEntryData => {
  const parsedDuration = parseDuration(duration);
  return {
    id: entryId,
    content,
    status,
    actions: {},
    metadata: {
      flags: { aiAnalyzed: false },
      timePosted: new Date().toISOString(),
      ...(parsedDuration !== undefined ? { duration: parsedDuration } : {}),
    },
  };
};

/**
 * Provides the unified journal entry pipeline for voice, manual, and quick logs.
 */
export const useJournalEntryPipeline = () => {
  const journalActions = useJournalActions();
  const entries = useJournalEntries();
  const tree = useJournalTree();
  const { applyEntryUpdates } = useEntryOrchestrator();

  const appendEntryToTreeLocal = useCallback(
    (entryId: string) => {
      const entryDate = getDateFromId(entryId);
      const { year, month, day } = toDateParts(entryDate);
      const yearNode = tree[year] ?? { totalExp: 0, months: {} };
      const monthNode = yearNode.months[month] ?? { totalExp: 0, days: {} };
      const dayNode = monthNode.days[day] ?? { totalExp: 0, entries: [] };
      const nextEntries = dayNode.entries.includes(entryId)
        ? dayNode.entries
        : [...dayNode.entries, entryId];

      journalActions.setTree({
        ...tree,
        [year]: {
          totalExp: yearNode.totalExp,
          months: {
            ...yearNode.months,
            [month]: {
              totalExp: monthNode.totalExp,
              days: {
                ...monthNode.days,
                [day]: {
                  totalExp: dayNode.totalExp,
                  entries: nextEntries,
                },
              },
            },
          },
        },
      });

      return { year, month, day };
    },
    [journalActions, tree]
  );

  const runAnalysisPipeline = useCallback(
    async (entryId: string, text: string, duration?: string) => {
      const uid = requireUserId();
      const { year, month, day } = toDateParts(getDateFromId(entryId));

      journalActions.updateEntry(entryId, { status: 'ANALYZING' });
      await updateJournalEntry(uid, entryId, { status: 'ANALYZING' });

      const analysisResult = await applyEntryUpdates(entryId, text, {
        useAI: true,
        duration,
      });

      const existing = entries[entryId];
      const nextDuration = parseDuration(duration) ?? existing?.metadata.duration;
      const nextMetadata = {
        flags: { aiAnalyzed: true },
        timePosted: existing?.metadata.timePosted ?? new Date().toISOString(),
        ...(nextDuration !== undefined ? { duration: nextDuration } : {}),
      };

      await updateJournalEntry(uid, entryId, {
        status: 'COMPLETED',
        actions: analysisResult.actions,
        result: {
          totalExpIncrease: analysisResult.totalExpIncrease,
          levelsGained: analysisResult.levelsGained,
          nodeIncreases: analysisResult.nodeIncreases,
        },
        metadata: nextMetadata,
      });

      await incrementTreeTotals(uid, year, month, day, analysisResult.totalExpIncrease);
    },
    [applyEntryUpdates, entries, journalActions]
  );

  /**
   * Voice auto-submit flow: Draft -> Transcribe -> Analyze.
   */
  const processVoiceEntry = useCallback(
    async (
      audioBlob: Blob,
      fallbackText?: string,
      onProcessingStateChange?: (entryId: string, isProcessing: boolean) => void
    ) => {
      const uid = requireUserId();
      const entryId = generateEntryId();
      const draft = buildDraftEntry(entryId, '🎤 Transcribing...', 'TRANSCRIBING');

      journalActions.optimisticAdd(draft);
      const { year, month, day } = appendEntryToTreeLocal(entryId);

      await createEntryBatch(uid, draft, {
        [year]: {
          totalExp: increment(0),
          months: {
            [month]: {
              totalExp: increment(0),
              days: {
                [day]: {
                  totalExp: increment(0),
                  entries: arrayUnion(entryId),
                },
              },
            },
          },
        },
      });

      let transcription = '';
      const fallback = fallbackText?.trim() ?? '';

      try {
        transcription = (await transcribeWebmAudio(audioBlob)) ?? '';
      } catch (error) {
        console.warn('[useJournalEntryPipeline] Gemini transcription failed:', error);
      }

      transcription = transcription.trim();
      if (!transcription && fallback) {
        transcription = fallback;
      }

      if (!transcription) {
        journalActions.updateEntry(entryId, { status: 'ANALYSIS_FAILED' });
        await updateJournalEntry(uid, entryId, { status: 'ANALYSIS_FAILED' });
        return entryId;
      }

      journalActions.updateEntry(entryId, { content: transcription, status: 'PENDING_ANALYSIS' });
      await updateJournalEntry(uid, entryId, { content: transcription, status: 'PENDING_ANALYSIS' });

      if (onProcessingStateChange) {
        onProcessingStateChange(entryId, true);
      }
      await runAnalysisPipeline(entryId, transcription);
      if (onProcessingStateChange) {
        onProcessingStateChange(entryId, false);
      }
      return entryId;
    },
    [appendEntryToTreeLocal, journalActions, runAnalysisPipeline]
  );

  /**
   * Manual entry flow: Draft -> Analyze (or manual actions if provided).
   */
  const processManualEntry = useCallback(
    async (
      text: string,
      options?: { duration?: string; useAI?: boolean; actions?: string[]; date?: Date }
    ) => {
      const { duration, useAI = true, actions = [], date } = options ?? {};
      const uid = requireUserId();
      const entryId = generateEntryId(date);
      const draft = buildDraftEntry(entryId, text, useAI ? 'PENDING_ANALYSIS' : 'DRAFT', duration);

      journalActions.optimisticAdd(draft);
      const { year, month, day } = appendEntryToTreeLocal(entryId);

      await createEntryBatch(uid, draft, {
        [year]: {
          totalExp: increment(0),
          months: {
            [month]: {
              totalExp: increment(0),
              days: {
                [day]: {
                  totalExp: increment(0),
                  entries: arrayUnion(entryId),
                },
              },
            },
          },
        },
      });

      if (useAI) {
        await runAnalysisPipeline(entryId, text, duration);
        return entryId;
      }

      if (actions.length > 0) {
        const result = await applyEntryUpdates(entryId, text, { useAI: false, actions, duration });
        const { year, month, day } = toDateParts(getDateFromId(entryId));
        const manualDuration = parseDuration(duration);
        await updateJournalEntry(uid, entryId, {
          status: 'COMPLETED',
          actions: result.actions,
          result: {
            totalExpIncrease: result.totalExpIncrease,
            levelsGained: result.levelsGained,
            nodeIncreases: result.nodeIncreases,
          },
          metadata: {
            flags: { aiAnalyzed: false },
            timePosted: new Date().toISOString(),
            ...(manualDuration !== undefined ? { duration: manualDuration } : {}),
          },
        });
        await incrementTreeTotals(uid, year, month, day, result.totalExpIncrease);
      }

      return entryId;
    },
    [appendEntryToTreeLocal, applyEntryUpdates, journalActions, runAnalysisPipeline]
  );

  /**
   * Quick log flow: Draft only (no analysis).
   */
  const processQuickLog = useCallback(
    async (text: string, date?: Date) => {
      const uid = requireUserId();
      const entryId = generateEntryId(date);
      const draft = buildDraftEntry(entryId, text, 'DRAFT');

      journalActions.optimisticAdd(draft);
      const { year, month, day } = appendEntryToTreeLocal(entryId);

      await createEntryBatch(uid, draft, {
        [year]: {
          totalExp: increment(0),
          months: {
            [month]: {
              totalExp: increment(0),
              days: {
                [day]: {
                  totalExp: increment(0),
                  entries: arrayUnion(entryId),
                },
              },
            },
          },
        },
      });

      return entryId;
    },
    [appendEntryToTreeLocal, journalActions]
  );

  /**
   * Retry AI analysis for an existing entry.
   */
  const retryAnalysis = useCallback(
    async (entryId: string) => {
      const entry = entries[entryId];
      if (!entry?.content) return;
      await runAnalysisPipeline(entryId, entry.content, entry.metadata.duration?.toString());
    },
    [entries, runAnalysisPipeline]
  );

  return {
    processVoiceEntry,
    processManualEntry,
    processQuickLog,
    retryAnalysis,
  };
};
