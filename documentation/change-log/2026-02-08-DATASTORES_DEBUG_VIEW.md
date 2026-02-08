# Datastores Debug View (2026-02-08)

## Summary
- Added a Datastores tab with split local/backend panels and a shared console feed.
- Introduced force-sync tooling to fetch Firestore data, hydrate stores, and trigger IndexedDB persistence.
- Force sync resets journal cache metadata on backend hydration.
- Added a JSON container renderer with delete actions for Firestore documents, collections, and fields.
- Centralized Firestore CRUD utilities for debug operations.

## Implementation References
- Datastores entry point: [src/features/debug/components/datastores-view.tsx](../../src/features/debug/components/datastores-view.tsx)
- Local datastore panel: [src/features/debug/components/local-datastore-view.tsx](../../src/features/debug/components/local-datastore-view.tsx)
- Backend datastore panel: [src/features/debug/components/database-view.tsx](../../src/features/debug/components/database-view.tsx)
- Force sync workflow: [src/features/debug/components/force-sync-panel.tsx](../../src/features/debug/components/force-sync-panel.tsx)
- Firestore snapshot mapping: [src/features/debug/utils/datastore-sync.ts](../../src/features/debug/utils/datastore-sync.ts)
- JSON container renderer: [src/features/debug/utils/json-container-renderer.tsx](../../src/features/debug/utils/json-container-renderer.tsx)
- Firestore CRUD utilities: [src/lib/firebase/firestore-crud.ts](../../src/lib/firebase/firestore-crud.ts)

## Backend Schema Plan (Pending)
- Create new Firestore documents for cdag topology, player statistics, aiConfig, and integrations under users/{uid}.
- Define explicit mappings between Firestore payloads and RootState shapes (including AI config and integrations).
- Update the backend schema reference in [documentation/state-management/firebase-backend.md](../state-management/firebase-backend.md) after paths are created.
