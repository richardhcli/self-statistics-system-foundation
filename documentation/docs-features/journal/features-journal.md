# Journal Feature (Read-Aside)

**Last updated**: 2026-02-07

## Summary
- Firebase is the source of truth. Zustand + IndexedDB provide a read-aside cache.
- Entries are normalized by ID; the tree index drives fast rendering.
- The unified entry pipeline handles draft, transcription, analysis, and Firebase writes.

## Core Data Structures
- **JournalEntryData / Tree / Cache**: [src/stores/journal/types.ts](../../../src/stores/journal/types.ts)
- **ID generator**: [src/features/journal/utils/id-generator.ts](../../../src/features/journal/utils/id-generator.ts)

## Storage & Sync
- **Firebase service**: [src/lib/firebase/journal.ts](../../../src/lib/firebase/journal.ts)
- **Zustand store**: [src/stores/journal/store.ts](../../../src/stores/journal/store.ts)
- **Migration utility**: [src/stores/journal/migration.ts](../../../src/stores/journal/migration.ts)

## Entry Orchestration
- **Unified pipeline**: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- **Processing state**: `onProcessingStateChange` callbacks in [src/features/journal/components/voice-recorder/voice-recorder.tsx](../../../src/features/journal/components/voice-recorder/voice-recorder.tsx)

## UI Surface
- **JournalFeature**: [src/features/journal/components/journal-feature.tsx](../../../src/features/journal/components/journal-feature.tsx)
- **JournalView**: [src/features/journal/components/journal-view.tsx](../../../src/features/journal/components/journal-view.tsx)
- **Entry item**: [src/features/journal/components/journal-entry-item/journal-entry-item.tsx](../../../src/features/journal/components/journal-entry-item/journal-entry-item.tsx)
- **Cache-aware fetch**: [src/features/journal/hooks/use-cached-fetch.ts](../../../src/features/journal/hooks/use-cached-fetch.ts)

## Constraints
- Entry IDs must follow `YYYYMMDD-HHmmss-` prefix for month-range queries.
- Tree document uses numeric `month` and `day` keys.
- Firebase rules must allow `journal_entries` and `journal_meta/tree_structure` writes.
