# Feature: Journal
**Last updated**: 2026-02-07

## Overview
The Journal feature is the primary input pipeline. Firebase is the source of truth. Zustand + IndexedDB act as a read-aside cache. Entries are stored by ID, and a lightweight tree index drives rendering.

## Data Model (Normalized)
- **Entry**: see [src/stores/journal/types.ts](../../src/stores/journal/types.ts)
- **Tree**: year/month/day summary index
- **Cache**: month-level TTL metadata

## Storage Architecture
- **Firebase service**: [src/lib/firebase/journal.ts](../../src/lib/firebase/journal.ts)
- **Zustand store**: [src/stores/journal/store.ts](../../src/stores/journal/store.ts)
- **Migration utility**: [src/stores/journal/migration.ts](../../src/stores/journal/migration.ts)

## Entry Pipelines
Unified orchestrator: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- **Voice auto-submit**: Draft -> Transcribe -> Analyze (Web Speech fallback)
- **To-Text review**: Web Speech preview -> manual edit -> Submit
- **Manual entry**: Draft -> Analyze automatically (no extra button needed)
- **Quick log**: Draft only

## UI Integration
- **JournalFeature**: [src/features/journal/components/journal-feature.tsx](../../src/features/journal/components/journal-feature.tsx)
- **JournalView**: [src/features/journal/components/journal-view.tsx](../../src/features/journal/components/journal-view.tsx)
- **Entry item**: [src/features/journal/components/journal-entry-item/journal-entry-item.tsx](../../src/features/journal/components/journal-entry-item/journal-entry-item.tsx)
- **Cache-aware fetch**: [src/features/journal/hooks/use-cached-fetch.ts](../../src/features/journal/hooks/use-cached-fetch.ts)

## Layout Behavior
- **Mobile**: Voice recorder → manual entry → journal view (stacked).
- **Desktop**: Voice recorder and manual entry are sticky in the left column; journal view scrolls in the right column.

## Integration Notes
- Requires authenticated user: `auth.currentUser.uid` for Firebase writes.
- Tree structure assumes numeric month/day keys and sortable entry IDs.
- Entry items show an "Analyzing..." button state while AI processing runs.

## Related Docs
- [documentation/change-log/2026-02-07-JOURNAL_ARCHITECTURE_PLAN.md](../change-log/2026-02-07-JOURNAL_ARCHITECTURE_PLAN.md)
- [documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md](../change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md)
