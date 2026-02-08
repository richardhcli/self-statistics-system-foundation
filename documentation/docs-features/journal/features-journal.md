# Journal Feature (Human Reference)

**Last updated**: 2026-02-07

## Purpose
- End-to-end journaling flows: voice, manual, and quick log.
- Firebase is the source of truth; Zustand + IndexedDB serve as a read-aside cache.
- A tree index (year/month/day) drives rendering and lazy month fetches.

## Architecture Map
- **Entry data + tree + cache**: [src/stores/journal/types.ts](../../../src/stores/journal/types.ts)
- **ID generation and parsing**: [src/features/journal/utils/id-generator.ts](../../../src/features/journal/utils/id-generator.ts)
- **Firebase journal service**: [src/lib/firebase/journal.ts](../../../src/lib/firebase/journal.ts)
- **Zustand store + cache rules**: [src/stores/journal/store.ts](../../../src/stores/journal/store.ts)
- **Unified pipeline**: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- **Entry orchestration glue**: [src/hooks/use-entry-orchestrator.ts](../../../src/hooks/use-entry-orchestrator.ts)

## User Flows
- **Voice auto-submit**: audio capture → transcription → analysis
- **To-Text review**: Web Speech preview → manual edit → analysis
- **Manual entry**: submit → analysis
- **Quick log**: submit → draft only

## UI Surface
- **Feature container**: [src/features/journal/components/journal-feature.tsx](../../../src/features/journal/components/journal-feature.tsx)
- **Journal view**: [src/features/journal/components/journal-view.tsx](../../../src/features/journal/components/journal-view.tsx)
- **Entry item**: [src/features/journal/components/journal-entry-item/journal-entry-item.tsx](../../../src/features/journal/components/journal-entry-item/journal-entry-item.tsx)
- **Manual entry form**: [src/features/journal/components/manual-entry-form.tsx](../../../src/features/journal/components/manual-entry-form.tsx)
- **Voice recorder**: [src/features/journal/components/voice-recorder/voice-recorder.tsx](../../../src/features/journal/components/voice-recorder/voice-recorder.tsx)

## Processing States
- Draft and analysis status updates are driven by the unified pipeline.
- Entry items show a persistent “Analyzing...” state while processing is active.
- Voice transcription falls back to Web Speech if Gemini fails.

## Layout Behavior
- **Mobile**: voice recorder → manual entry → journal view (stacked).
- **Desktop**: input cards are sticky on the left; journal list scrolls on the right.

## Data Constraints
- Entry IDs must remain sortable for month-range queries.
- Tree keys are numeric `year`, `month`, `day`.
- Firebase rules must allow `journal_entries` and `journal_meta/tree_structure` writes.

## Troubleshooting
- If entries appear empty, confirm the tree subscription updates the cache.
- If analysis appears stuck, confirm processing state callbacks are wired.
- If transcription fails, verify Web Speech fallback supplies content.
