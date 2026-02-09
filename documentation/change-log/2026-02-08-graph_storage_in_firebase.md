This blueprint outlines the technical implementation for a 1,000-node weighted Directed Acyclic Graph (DAG) using a "Sprint-style" Firebase architecture.

---

## 🛠️ Data Schema (Graph Collection)

All graph data lives under `users/{uid}/graphs/cdag_topology`.

| Location | Key Fields |
| --- | --- |
| **`users/{uid}/graphs/cdag_topology`** | `adjacencyList`, `nodeSummaries`, `metrics`, `lastUpdated`, `version` |
| **`users/{uid}/graphs/cdag_topology/nodes/{nodeId}`** | `label`, `type`, `metadata` |
| **`users/{uid}/graphs/cdag_topology/edges/{edgeId}`** | `source`, `target`, `weight`, `metadata` |

* **Why this works:** Decoupling edges from nodes allows edges to scale up to 10+ connections per node with complex metadata without hitting the 1MB document limit.
* **Unique IDs:** Using `${source}->${target}` as the Edge ID prevents duplicate relationships and allows O(1) direct lookups.

---

## 🚀 Performance & Scaling for 1,000 Nodes

* **Flat Retrieval:** For a graph of this size, a single `getDocs` call on `users/{uid}/graphs/cdag_topology/edges` is more efficient than recursive calls.
* **Efficient Traversals:** Indexed queries on `source` or `target` fields allow lightning-fast parent/child lookups.
* **Cost Efficiency:** 1,000 nodes fit comfortably within Firebase's free tier for daily reads, provided you implement basic caching or state management.

---

## 🎣 Feature Hook: `useGraphData`

See the read-aside service implementation in [src/lib/firebase/graph-service.ts](../../src/lib/firebase/graph-service.ts) and the cache state in [src/stores/cdag-topology/store.ts](../../src/stores/cdag-topology/store.ts).

---

## ⚠️ Critical DAG Considerations

### 1. Cycle Prevention (App Logic)

Firestore does not enforce DAG constraints. You **must** verify that `targetId` is not an ancestor of `sourceId` in your React logic before calling `upsertEdge`.

### 2. Required Indexes

To filter edges by source, target, or metadata, you must define indexes in `firestore.indexes.json`:

* `edges`: `source` (Asc) + `weight` (Desc)
* `edges`: `target` (Asc) + `metadata.type` (Asc)

### 3. State Management

For visualization (e.g., using React Flow), transform the flat Firestore lists into an object-mapped structure in a local `useEffect` to avoid redundant O(n²) array searches.
