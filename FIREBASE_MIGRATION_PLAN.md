# Firebase Migration Plan: Global Read-Aside Architecture

**Date**: February 8, 2026
**Status**: 🔄 IN PROGRESS
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

---

## Phase 1: Infrastructure & Journal Refactor (Pilot)
**Reference**: `documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md`

- [x] **1.1. Firebase Configuration**
    - `src/lib/firebase/config.ts` initialized.
    - Auth (Anonymous/Google) configured.

- [ ] **1.2. Journal Store Migration**
    - Implement `StandardStoreState` pattern.
    - Split "Metadata" (Calendar/List) from "Content" (Entry Details).
    - **Goal**: Reduce read costs by only fetching full entry text when opened.

- [ ] **1.3. Persistence Layer Update**
    - Reconfigure `persist` middleware to act as a cache restorer, not the primary database loader.
    - Implement "Stale-While-Revalidate" logic on boot.

---

## Phase 2: CDAG Topology Migration
**Reference**: `documentation/change-log/2026-02-07-CDAG_TOPOLOGY_READ_ASIDE_PLAN.md`

- [ ] **2.1. Graph Structure Separation**
    - Store lightweight adjacency list in `cdag_topology/meta/structure`.
    - Store heavy node data in `cdag_topology/nodes/{id}`.

- [ ] **2.2. Lazy Loading Graph**
    - Initial Load: Fetch only Structure (Nodes positions, edges).
    - Detail Load: Fetch Node Data only when user hovers/selects.

---

## Phase 3: User Information & Settings

- [ ] **3.1. Profile Store**
    - Migrate User Profile to single document: `users/{uid}/profile/data`.
    - Real-time listener for profile changes (low bandwidth).

- [ ] **3.2. Integrations & AI Config**
    - Store API keys and preferences in `users/{uid}/settings/secure`.
    - Implement security rules to ensure only the user can read their keys.

---

## Phase 4: Legacy Cleanup

- [ ] **4.1. Delete Legacy Stores**
    - Remove all V1/V2 stores that do not follow the Read-Aside pattern.
    - Delete `src/lib/firebase/sync-engine.ts` (if created) - we are using direct service calls, not a generic sync engine.

- [ ] **4.2. Update Documentation**
    - Mark old architecture docs as ARCHIVED.
    - Ensure `ai-guidelines.md` is the single source of truth for the pattern.

---

## AI Implementation Guidelines

1. **Direct Service Calls**: Do not build a complex "Sync Engine" class. Use simple, functional service calls (`fetchEntry`, `saveEntry`).
2. **Zustand is Cache**: The store should explicitly track `lastFetched` timestamps.
3. **Optimistic First**: Always update the UI immediately with `set((state) => ...)` before calling `await firebase.save(...)`.
