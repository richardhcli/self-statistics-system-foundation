# Journal Entry Pipeline (Unified)

**Updated**: 2026-02-07

## Purpose
Single orchestrator that owns draft creation, transcription, AI analysis, and Firebase writes.

## Orchestrator
- Hook: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- Uses: [src/hooks/use-entry-orchestrator.ts](../../../src/hooks/use-entry-orchestrator.ts)
- Writes: [src/lib/firebase/journal.ts](../../../src/lib/firebase/journal.ts)

## Flows
- **Voice auto-submit**: Draft -> Transcribe -> Analyze
- **To-Text review**: Web Speech preview -> manual edit -> Analyze
- **Manual entry**: Draft -> Analyze (or manual actions)
- **Quick log**: Draft only

## Output
- Entry document updated in `journal_entries`
- Tree structure updated in `journal_meta/tree_structure`
- Cache updated in Zustand

## Integration Points
- Manual form: [src/features/journal/components/manual-entry-form.tsx](../../../src/features/journal/components/manual-entry-form.tsx)
- Voice recorder: [src/features/journal/components/voice-recorder/voice-recorder.tsx](../../../src/features/journal/components/voice-recorder/voice-recorder.tsx)
- Debug injections: [src/features/debug/api/test-injections.ts](../../../src/features/debug/api/test-injections.ts)
