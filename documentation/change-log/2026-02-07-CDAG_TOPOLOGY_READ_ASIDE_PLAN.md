# Plan of Action: CDAG Topology Read-Aside Refactor

**Date**: February 7, 2026
**Implements**: `documentation/change-log/2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md`
**Status**: Pending Execution

This plan defines the refactor for the CDAG topology store to follow the **Global Storage Architecture (Read-Aside Pattern)**. The journal refactor must be completed and stabilized before starting this plan.

---

## 🛑 Execution Order (Critical)

1. **Complete Journal Refactor First** (Phases 1-6).
2. **Only then** proceed with CDAG Topology migration.

---

## Phase 1: Schema Definition

**Goal**: Normalize topology storage for Firebase + Zustand read-aside.

- [ ] **1.1. Firebase Schema**
  - `users/{uid}/cdag_topology/nodes/{nodeId}`
  - `users/{uid}/cdag_topology/edges/{edgeId}`
  - `users/{uid}/cdag_topology/meta/graph_structure` (lightweight summary)

- [ ] **1.2. Summary Document Shape**
  - `graph_structure` holds lightweight metadata:
    - `nodeCount`, `edgeCount`, `lastUpdated`, `version`
    - Optional: `rootNodeIds`, `recentNodeIds`

---

## Phase 2: Firebase Service Layer

**Goal**: Create read-aside Firebase services for topology data.

- [ ] **2.1. Service File**
  - File: `src/lib/firebase/cdag-topology.ts`

- [ ] **2.2. Read Methods**
  - `subscribeToTopologyMeta(uid, cb)`
  - `fetchNodesByIds(uid, ids)`
  - `fetchEdgesByIds(uid, ids)`

- [ ] **2.3. Write Methods (Atomic)**
  - `createNodeBatch(uid, node, metaUpdate)`
  - `updateNodeBatch(uid, nodeId, updates, metaUpdate)`
  - `createEdgeBatch(uid, edge, metaUpdate)`

---

## Phase 3: Store Refactor (Read-Aside Cache)

**Goal**: Rebuild Zustand store to mirror the Firebase schema.

- [ ] **3.1. Store Shape**
  - `nodes: Record<string, NodeData>`
  - `edges: Record<string, EdgeData>`
  - `meta: { lastFetched, isDirty, nodeCount, edgeCount }`

- [ ] **3.2. Actions**
  - `setMeta(meta)`
  - `cacheNodes(nodes)`
  - `cacheEdges(edges)`
  - `invalidateMeta()`
  - `fetchNodes(ids)` (cache-aware)
  - `fetchEdges(ids)` (cache-aware)

- [ ] **3.3. Persistence**
  - Persist `nodes`, `edges`, and `meta` only.

---

## Phase 4: UI and Orchestration Updates

**Goal**: Update UI and orchestrator usage to work with the new cache model.

- [ ] Replace direct store reads with `useGraphNodes()` and `useGraphEdges()` selectors.
- [ ] Update any manual sync logic to call Firebase service methods.

---

## Phase 5: Migration (Wipe and Reset)

**Goal**: Destroy legacy local-first structures.

- [ ] Purge old IndexedDB keys for `cdag-topology-store-v2`.
- [ ] Remove any legacy converter utilities or migration adapters.

---

## Phase 6: Validation

**Goal**: Ensure graph operations are consistent across local cache and Firebase.

- [ ] Verify `nodeCount` / `edgeCount` consistency.
- [ ] Confirm cache invalidation and re-fetch flows.
- [ ] Manual smoke test: add node, add edge, refresh app, validate cache hydration.
