# Journal Quick Reference

**Updated**: 2026-02-07

## Entry Flows
- **Voice auto-submit**: record -> stop -> transcribe -> analyze
- **To-Text review**: record -> Web Speech preview -> edit -> submit
- **Manual entry**: type -> submit -> analyze
- **Quick log**: type -> save (no analysis)

## Core Files
- Pipeline: [src/features/journal/hooks/use-journal-entry-pipeline.ts](../../../src/features/journal/hooks/use-journal-entry-pipeline.ts)
- View: [src/features/journal/components/journal-view.tsx](../../../src/features/journal/components/journal-view.tsx)
- Feature container: [src/features/journal/components/journal-feature.tsx](../../../src/features/journal/components/journal-feature.tsx)
- Store: [src/stores/journal/store.ts](../../../src/stores/journal/store.ts)
- Firebase: [src/lib/firebase/journal.ts](../../../src/lib/firebase/journal.ts)

## IDs & Tree Keys
- Entry IDs: `YYYYMMDD-HHmmss-xxxx`
- Tree keys: numeric `year`, `month`, `day`

## Troubleshooting
- **No user**: pipeline requires `auth.currentUser.uid`
- **Entries missing**: ensure tree uses numeric month/day keys
- **Cache stale**: trigger a month expand to fetch
