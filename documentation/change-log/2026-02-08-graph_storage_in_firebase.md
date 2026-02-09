This blueprint defines the Manifest Pattern for CDAG storage in Firebase.

---

## Data Schema (Manifest + Source of Truth)

All graph data lives under `users/{uid}/graphs/cdag_topology`.

| Location | Key Fields |
| --- | --- |
| **`users/{uid}/graphs/cdag_topology/graph_metadata/topology_manifest`** | `nodes`, `edges`, `metrics`, `lastUpdated`, `version` |
| **`users/{uid}/graphs/cdag_topology/nodes/{nodeId}`** | `label`, `type`, `metadata` |
| **`users/{uid}/graphs/cdag_topology/edges/{edgeId}`** | `source`, `target`, `weight`, `metadata` |

Why this works:
- Manifest provides a fast, single-read boot path for graph rendering.
- Nodes/edges collections remain the authoritative, full-detail store.

---

## Manifest Structure

The manifest stores lightweight node summaries and adjacency + weights:

```typescript
{
  lastUpdated: string,
  version: number,
  metrics: { nodeCount: number, edgeCount: number },
  nodes: {
    [nodeId: string]: { label: string, type: string }
  },
  edges: {
    [nodeId: string]: Array<{ target: string, weight?: number }>
  }
}
```

---

## Read-Aside Hydration Pipeline

1. IndexedDB Hydration (Zustand cached data renders immediately).
2. Manifest Fetch (single document read).
3. Structure Subscription (manifest onSnapshot for live refresh).
4. Details Refresh (full nodes + edges fetch once per app load, then stale-only with a 30-minute TTL).

Implementation references:
- Graph read-aside service: [src/lib/firebase/graph-service.ts](../../src/lib/firebase/graph-service.ts)
- Store + cache logic: [src/stores/cdag-topology/store.ts](../../src/stores/cdag-topology/store.ts)
- Visual graph sync hook: [src/hooks/use-cdag-structure.ts](../../src/hooks/use-cdag-structure.ts)

---

## Batch Write Requirements

All topology changes must update BOTH tiers in one batch:

- Nodes collection document
- Edges collection document (if applicable)
- Manifest `nodes` and `edges` entries
- Manifest `metrics` and `lastUpdated`

No backward compatibility is maintained. Legacy collections and dotted-field schemas are removed.

---

## Performance Notes (1,000 Node Target)

- Single manifest read is O(1) for boot.
- Full detail fetches are amortized with TTL and session-only sync.
- Edge IDs remain `${source}->${target}` for direct lookups.