# Plan of Action: CDAG Topology Read-Aside Refactor

**Date**: February 8, 2026
**Implements**: `documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md`
**Status**: ✅ Complete

This plan defines the refactor for the CDAG topology store to follow the **Global Storage Architecture (Read-Aside Pattern)**. The journal refactor must be completed and stabilized before starting this plan.

---

## 🛑 Execution Order (Critical)

1. **Complete Journal Refactor First** (Phases 1-6).
2. **Only then** proceed with CDAG Topology migration.

---

## Phase 1: Schema Definition

**Goal**: Normalize topology storage for Firebase + Zustand read-aside.

- [x] **1.1. Firebase Schema**
  - `users/{uid}/graphs/cdag_topology` (structure doc: adjacency list & lightweight stats)
  - `users/{uid}/graphs/cdag_topology/nodes/{nodeId}`
  - `users/{uid}/graphs/cdag_topology/edges/{edgeId}`

- [x] **1.2. Structure Document Shape**
  - `structure` holds lightweight relationship data and metadata:
    - `adjacencyList`: Record<string, string[]> (for quick traversals without loading all node data)
    - `nodeCount`, `edgeCount`
    - `lastUpdated`, `version`

---

## Phase 2: Firebase Service Layer

**Goal**: Create read-aside Firebase services for topology data.

- [x] **2.1. Service File**
  - File: `src/lib/firebase/cdag-topology.ts`

- [x] **2.2. Read Methods**
  - `subscribeToStructure(uid, cb)` (Real-time listener for structure/meta)
  - `fetchNodesByIds(uid, ids)` (On-demand detail fetch)
  - `fetchEdgesByIds(uid, ids)`

- [x] **2.3. Write Methods (Atomic)**
  - `createNodeBatch(uid, node, structureUpdate)`
  - `updateNodeBatch(uid, nodeId, updates, structureUpdate)`
  - `createEdgeBatch(uid, edge, structureUpdate)`

---

## Phase 3: Store Refactor (Read-Aside Cache)

**Goal**: Rebuild Zustand store to adhere to the `StandardStoreState` interface defined in the Blueprint.

- [x] **3.1. Store Shape (Generic Compliance)**
  - Reference: [src/stores/cdag-topology/types.ts](../../src/stores/cdag-topology/types.ts)
  - Implementation: [src/stores/cdag-topology/store.ts](../../src/stores/cdag-topology/store.ts)

- [x] **3.2. Actions Implementation Strategy**
  - `fetchStructure()`: Loads adjacency list & counts. Updates `structure` and `metadata.structure.lastFetched`.
  - `fetchNodes(ids)`: Smart fetch. Checks `metadata.nodes[id].lastFetched`. Only requests stale/missing keys from Firebase.
  - `addNode(node)`: 
    1. Optimistic update (Zustand).
    2. Persist to IndexedDB (Middleware).
    3. Async call to `firebase.createNodeBatch`.
    4. If fail, revert or flag error.

- [x] **3.3. Persistence**
  - Persist `nodes`, `edges`, `structure`, and `metadata` to IndexedDB via generic middleware.

---

## Phase 4: UI and Orchestration Updates

**Goal**: Update UI and orchestrator usage to work with the new cache model.

- [x] Refactor visual and developer graph views to sync structure via `useCdagStructure`.
- [x] Update node detail flows to rely on read-aside fetch actions where needed.

---

## Phase 5: Migration (Wipe and Reset)

**Goal**: Destroy legacy local-first structures.

- [x] Purge old IndexedDB keys via schema bump to `cdag-topology-store-v3`.
- [x] Remove legacy converter utilities or migration adapters.

---

## Phase 6: Validation

**Goal**: Ensure graph operations are consistent across local cache and Firebase.

- [x] Verify `adjacency` matches `nodes` keys.
- [x] Confirm lazy loading triggers only when data is missing or stale.

---

## ✅ Final Summary

The CDAG topology store now follows the read-aside architecture with Firebase-backed services, a structure-first cache strategy, and removal of legacy local-first sync utilities. All topology data is normalized, cached with metadata, and persisted without storing actions, aligning with the Global Storage Architecture blueprint.
