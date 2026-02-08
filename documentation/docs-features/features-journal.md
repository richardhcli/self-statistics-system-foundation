# Feature: Journal (AI Overview)
**Last updated**: 2026-02-07

## What It Does
- Primary journaling pipeline with voice, manual, and quick-log flows.
- Firebase is the source of truth; Zustand + IndexedDB act as a read-aside cache.
- A tree index (year/month/day) drives fast navigation and lazy entry loading.

## Core Files (Start Here)
- Feature container: [src/features/journal/components/journal-feature.tsx](../../src/features/journal/components/journal-feature.tsx)
- Unified pipeline: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- Store + cache: [src/stores/journal/store.ts](../../src/stores/journal/store.ts)
- Firebase service: [src/lib/firebase/journal.ts](../../src/lib/firebase/journal.ts)

## Key Constraints
- Entry IDs must remain sortable for month-range queries.
- Tree keys are numeric `year`, `month`, `day`.
- Auth is required for Firebase writes.

## Behavior Notes
- Manual entries auto-trigger analysis.
- Voice entries fall back to Web Speech when Gemini fails.
- Desktop layout keeps inputs sticky on the left; journal scrolls on the right.

## Deep Dive (Human Docs)
- [documentation/docs-features/journal/features-journal.md](journal/features-journal.md)
- [documentation/change-log/2026-02-07-JOURNAL_ARCHITECTURE_PLAN.md](../change-log/2026-02-07-JOURNAL_ARCHITECTURE_PLAN.md)
- [documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md](../change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md)
