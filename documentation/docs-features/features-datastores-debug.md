# Feature Blueprint: Debug Datastores View

## Purpose
Provides a split debug interface to inspect and reconcile local IndexedDB-backed state with Firestore-backed data. This view is designed for manual recovery, inspection, and controlled synchronization.

## Routing
- Debug tab: Datastores
- Route: `/app/debug/datastores`
- Entry: [src/features/debug/components/datastores-view.tsx](../../src/features/debug/components/datastores-view.tsx)

## Component Map
- Console feed: [src/features/debug/components/datastores-console.tsx](../../src/features/debug/components/datastores-console.tsx)
- Local datastore panel: [src/features/debug/components/local-datastore-view.tsx](../../src/features/debug/components/local-datastore-view.tsx)
- Backend datastore panel: [src/features/debug/components/database-view.tsx](../../src/features/debug/components/database-view.tsx)
- Force sync orchestrator: [src/features/debug/components/force-sync-panel.tsx](../../src/features/debug/components/force-sync-panel.tsx)
- Firestore snapshot mapping: [src/features/debug/utils/datastore-sync.ts](../../src/features/debug/utils/datastore-sync.ts)
- JSON container renderer: [src/features/debug/utils/json-container-renderer.tsx](../../src/features/debug/utils/json-container-renderer.tsx)

## Data Flow (Manual Sync)
- Fetch Firestore snapshot via the debug controls.
- Map Firestore payloads into RootState using the debug snapshot mapper.
- Hydrate Zustand stores with the mapped RootState.
- Reset journal cache metadata during backend hydration.
- Trigger IndexedDB persistence by re-applying the current RootState.
- Log each stage to the Datastores console for operator visibility.

## Firestore Interaction
- CRUD utilities are centralized in [src/lib/firebase/firestore-crud.ts](../../src/lib/firebase/firestore-crud.ts).
- The JSON renderer surfaces delete actions for documents, collections, fields, and array values.
- Backend deletes refresh the on-screen snapshot after completion.

## Known Gaps
- The debug mapper preserves local data for missing Firestore paths.
