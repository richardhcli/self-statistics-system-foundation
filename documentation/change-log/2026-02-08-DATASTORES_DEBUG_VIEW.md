
# Datastores Debug View (2026-02-08)
Datastores Debug View & Force Sync Implementation

**Date:** 2026-02-08
**Status:** Feature Complete / Stability Fixes Applied

## Summary
- Added a Datastores tab with split local/backend panels and a shared console feed.
- Introduced force-sync tooling to fetch Firestore data, hydrate stores, and trigger IndexedDB persistence.
- Force sync resets journal cache metadata on backend hydration.
- Added a JSON container renderer with delete actions for Firestore documents, collections, and fields.
- Centralized Firestore CRUD utilities for debug operations.

## 1. Feature Overview
A new **Datastores** tab has been added to the Debug View (`/debug`), providing a split-pane interface to visualize and manage the application's state:
- **Local Datastore (Left)**: Visualizes the current client-side state (Zustand + Persistence Layer).
- **Backend Datastores (Right)**: Visualizes the server-side state (Firestore) for the current user.
- **Console (Bottom)**: A shared "Datastore Output" console for tracking sync operations and errors.

## 2. Force Sync Mechanism
A "Force Sync" panel implements a manual hydration pipeline:
1. **Fetch**: Retrieves a snapshot of all user collections from Firestore.
2. **Hydrate**: Maps the Firestore data to the client's `RootState`.
3. **Persist**: Updates Zustand stores and flushes changes to IndexedDB.

## 3. Component Architecture
- **`DatastoresView`**: Main layout container.
- **`LocalDatastoreView`**: Renders `useJournalStore`, `useGraphStore`, etc., using a generic JSON tree renderer.
- **`DatabaseView`**: Renders Firestore collections with CRUD capabilities (view/delete).
- **`ForceSyncPanel`**: Controls for "Fetch from Backend" and "Apply to Stores".
- **`DatastoresConsole`**: Specialized logger for data operations.

## 4. Critical Bug Fix: AI Config Hydration
**Issue**: Using "Force Sync" caused a crash: `TypeError: useAiConfigStore(...).actions.setConfig is not a function`.
**Root Cause**: The `ai-config` store's `persist` middleware lacked a `partialize` and `merge` configuration. When hydrating from a full state object (or empty), the store's `actions` were being overwritten by the persisted state, removing the function definitions.
**Reference Code**:
```typescript
{
  name: 'ai-config-storage',
  partialize: (state) => ({ config: state.config }), // ONLY persist data
  merge: (persistedState, currentState) => ({
    ...currentState, // Preserve actions
    ...persistedState, // Overwrite data
  }),
}
```

## 5. New Utilities
- **`json-container-renderer.tsx`**: A recursive JSON viewer with support for "Delete" actions on keys/paths.
- **`firestore-crud.ts`**: Centralized wrapper for `getCollectionDocs`, `deleteDocument`, etc.
- **`datastore-sync.ts`**: Logic for mapping Firestore documents to store slices.

## 6. Implementation References
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
