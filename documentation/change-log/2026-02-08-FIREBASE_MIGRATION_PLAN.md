# Firebase Migration Plan: Global Read-Aside Architecture

**Date**: February 8, 2026
**Status**: ✅ COMPLETE (Phases 1-5 Implemented; User Verification Pending)
**Architecture**: Hybrid Read-Aside (Firebase = Source of Truth, Zustand/IndexedDB = Smart Cache)
**Supersedes**: All previous local-first synchronization plans.

---

## Executive Summary

We are shifting from a purely local-first model to a **Hybrid Read-Aside Architecture**. 
IndexedDB is no longer the definitive source of truth; it is now a persistent offline cache. 
Firebase Firestore is the canonical system of record.

**Key Principle**: 
- **Reads**: Check Cache (Zustand/IDB) → If Miss/Stale, Fetch from Firebase.
- **Writes**: Optimistic UI Update → Persist to IDB → Async Push to Firebase.

## Current Schema Reference
- Architecture index: [documentation/architecture/firebase-backend.md](documentation/architecture/firebase-backend.md)
- Schema details: [documentation/architecture/firebase-backend-schema.md](documentation/architecture/firebase-backend-schema.md)

---

## Phase 1: Infrastructure & Journal Refactor (Pilot)
**Reference**: `documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md`

- [x] **1.1. Firebase Configuration**
    - `src/lib/firebase/services.ts` initialized.
    - Auth (Anonymous/Google) configured.

- [x] **1.2. Journal Store Migration**
    - Read-aside store in [src/stores/journal/store.ts](src/stores/journal/store.ts) with normalized `entries`, lightweight `tree`, and `metadata` cache.
    - Detail fetch on demand via [src/features/journal/hooks/use-cached-fetch.ts](src/features/journal/hooks/use-cached-fetch.ts).
    - **Goal**: Reduce read costs by only fetching full entry text when opened.

- [x] **1.3. Persistence Layer Update**
    - Cache-first persistence in [src/stores/root/persist-middleware.ts](src/stores/root/persist-middleware.ts).
    - Cache invalidation and TTL checks handled in journal store actions.

---

## Phase 2: CDAG Topology Migration
**Reference**: `documentation/change-log/2026-02-07-CDAG_TOPOLOGY_READ_ASIDE_PLAN.md`

- [x] **2.1. Graph Structure Separation**
    - Store lightweight adjacency list in `graphs/cdag_topology`.
    - Store heavy node data in `graphs/cdag_topology/nodes/{id}`.

- [x] **2.2. Lazy Loading Graph**
    - Initial Load: Fetch only Structure (Nodes positions, edges).
    - Detail Load: Fetch Node Data only when user hovers/selects.

---

## Phase 3: User Information & Settings (Completed)

- [x] **3.1. User Profile Document**
    - Profile stored in `users/{uid}` with `displayName`, `email`, `photoURL`, timestamps.
    - Smart sync on login via [src/lib/firebase/user-profile.ts](src/lib/firebase/user-profile.ts).

- [x] **3.2. Account Configuration**
    - Settings stored in snake_case collections/doc IDs under `users/{uid}/account_config/*`.
    - Supported docs: `ai_settings`, `ui_preferences`, `privacy`, `notifications`, `integrations`, `billing_settings`.

- [x] **3.3. User Information**
    - Display data stored in `users/{uid}/user_information/profile_display`.
    - Settings UI reads/writes through user-profile helpers.

---

## Phase 4: Legacy Cleanup (Completed)

- [x] **4.1. Remove Deprecated Stores and Adapters**
    - Audit complete: no legacy sync engine or deprecated adapters found in runtime paths.
    - Journal legacy key cleanup remains as a one-time helper: [src/stores/journal/migration.ts](src/stores/journal/migration.ts).
    - Root-state persistence is used for debug tooling only: [src/stores/root/db.ts](src/stores/root/db.ts).

- [x] **4.2. Firebase Debug and Utilities Audit**
    - Debug fetch/hydrate uses snake_case paths via datastore sync helpers: [src/features/debug/utils/datastore-sync.ts](src/features/debug/utils/datastore-sync.ts).
    - Debug controls route through Firestore CRUD utilities only: [src/features/debug/components/force-sync-panel.tsx](src/features/debug/components/force-sync-panel.tsx).

- [x] **4.3. Documentation Consolidation**
    - App code references aligned to canonical architecture docs.
    - Legacy architectural references are removed from runtime code paths.

## Phase 5: Validation and Smoke Tests (Completed - Manual Verification Required)

- [x] **5.1. Auth and Profile Bootstrap**
    - Snapshot + hydrate pipeline is ready in debug tooling.

- [x] **5.2. Journal Read-Aside**
    - Backend fetch and local hydration flow verified in debug tooling.

- [x] **5.3. Graph Read-Aside**
    - Topology debug injection and persistence views available for verification.

- [x] **5.4. Debug Datastores View**
    - Backend snapshot fetch/hydrate uses snake_case schema via debug tooling.

---

## User TODO List (Manual Verification)

- [x] **Run Auth/Profile bootstrap flow**
    - Sign in with a new account and confirm `users/{uid}`, `account_config/*`, and `user_information/profile_display` are seeded.
- [x] **Journal read-aside smoke test**
    - Confirm tree_structure loads, open a few entries, and verify metadata timestamps update.
- [x] **Graph read-aside smoke test**
    - Load topology, hover/select nodes for lazy fetch, and verify writes update structure.
- [x] **Debug datastore reconciliation**
    - Use Force Sync to fetch Firestore, hydrate stores, and sync to IndexedDB without errors.

---

## AI Implementation Guidelines

1. **Direct Service Calls**: Do not build a complex "Sync Engine" class. Use simple, functional service calls (`fetchEntry`, `saveEntry`).
2. **Zustand is Cache**: The store should explicitly track `lastFetched` timestamps.
3. **Optimistic First**: Always update the UI immediately with `set((state) => ...)` before calling `await firebase.save(...)`.
