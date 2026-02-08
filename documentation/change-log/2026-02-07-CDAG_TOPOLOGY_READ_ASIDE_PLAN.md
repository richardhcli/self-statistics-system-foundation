# Plan of Action: CDAG Topology Read-Aside Refactor

**Date**: February 8, 2026
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
  - `users/{uid}/cdag_topology/meta/structure` (adjacency list & lightweight stats)

- [ ] **1.2. Structure Document Shape**
  - `structure` holds lightweight relationship data and metadata:
    - `adjacencyList`: Record<string, string[]> (for quick traversals without loading all node data)
    - `nodeCount`, `edgeCount`
    - `lastUpdated`, `version`

---

## Phase 2: Firebase Service Layer

**Goal**: Create read-aside Firebase services for topology data.

- [ ] **2.1. Service File**
  - File: `src/lib/firebase/cdag-topology.ts`

- [ ] **2.2. Read Methods**
  - `subscribeToStructure(uid, cb)` (Real-time listener for structure/meta)
  - `fetchNodesByIds(uid, ids)` (On-demand detail fetch)
  - `fetchEdgesByIds(uid, ids)`

- [ ] **2.3. Write Methods (Atomic)**
  - `createNodeBatch(uid, node, structureUpdate)`
  - `updateNodeBatch(uid, nodeId, updates, structureUpdate)`
  - `createEdgeBatch(uid, edge, structureUpdate)`

---

## Phase 3: Store Refactor (Read-Aside Cache)

**Goal**: Rebuild Zustand store to adhere to the `StandardStoreState` interface defined in the Blueprint.

- [ ] **3.1. Store Shape (Generic Compliance)**
  ```typescript
  interface CDAGStoreState {
    // THE DATA (Normalized)
    nodes: Record<string, NodeData>;
    edges: Record<string, EdgeData>;
    
    // THE STRUCTURE (Lightweight Index)
    structure: {
      adjacency: Record<string, string[]>;
      metrics: { nodeCount: number; edgeCount: number };
    };

    // THE METADATA (Cache Control)
    metadata: {
      nodes: Record<string, { lastFetched: number }>;
      edges: Record<string, { lastFetched: number }>;
      structure: { lastFetched: number; isDirty: boolean };
    };

    // ACTIONS
    actions: {
        // Sync
        fetchStructure: () => Promise<void>;
        fetchNodes: (ids: string[]) => Promise<void>;
        fetchEdges: (ids: string[]) => Promise<void>;
        
        // Optimistic
        addNode: (node: NodeData) => void;
        updateNode: (id: string, updates: Partial<NodeData>) => void;
        addEdge: (edge: EdgeData) => void;
    }
  }
  ```

- [ ] **3.2. Actions Implementation Strategy**
  - `fetchStructure()`: Loads adjacency list & counts. Updates `structure` and `metadata.structure.lastFetched`.
  - `fetchNodes(ids)`: Smart fetch. Checks `metadata.nodes[id].lastFetched`. Only requests stale/missing keys from Firebase.
  - `addNode(node)`: 
    1. Optimistic update (Zustand).
    2. Persist to IndexedDB (Middleware).
    3. Async call to `firebase.createNodeBatch`.
    4. If fail, revert or flag error.

- [ ] **3.3. Persistence**
  - Persist `nodes`, `edges`, `structure`, and `metadata` to IndexedDB via generic middleware.

---

## Phase 4: UI and Orchestration Updates

**Goal**: Update UI and orchestrator usage to work with the new cache model.

- [ ] Refactor `use-graph-viz.ts` to consume `store.structure.adjacency` for layout calculation (avoids loading full nodes).
- [ ] Update node detail panels to trigger `fetchNodes([selectedId])` on mount.

---

## Phase 5: Migration (Wipe and Reset)

**Goal**: Destroy legacy local-first structures.

- [ ] Purge old IndexedDB keys for `cdag-topology-store-v2`.
- [ ] Remove any legacy converter utilities or migration adapters.

---

## Phase 6: Validation

**Goal**: Ensure graph operations are consistent across local cache and Firebase.

- [ ] Verify `adjacency` matches `nodes` keys.
- [ ] Confirm lazy loading triggers only when data is missing or stale.
