# Concept Graph Visualization

The Concept Graph is a stable, interactive DAG visualization of the user's cognitive hierarchy.

## Stable Hierarchical Layout
The graph uses a custom layering engine (`use-dag-layout`) that ensures a predictable, left-to-right flow.

### Topological Ranking
- **Roots (Left)**: Core Characteristics (Attributes).
- **Intermediate**: Skills.
- **Leaves (Right)**: Actions.

### Visual Encoding
- **Node Colors**: Indigo (Attributes), Amber (Skills), Emerald (Actions).
- **Edge Weight**: The thickness and opacity of the connection reflect the logical weight in the topology.
- **Direction**: Arrowheads point from parent concepts to child actions.

## Interactive Mechanics
- **Ultra-Rigid Snapping**: Nodes are forcibly locked to their calculated grid positions. They can be moved for exploration but "teleport" back to the exact center of their layer slot upon release.
- **Rank Swapping**: Dragging a node over its neighbor in the same column swaps their vertical positions, allowing for manual layout optimization.

## Data Synchronization
The visual graph uses a Firebase-first read-aside flow:
- **Fast Boot**: IndexedDB hydrates the cached topology immediately on load.
- **Backend Sync**: The manifest is fetched from Firebase on mount and re-synced through the subscription stream.
- **Authoritative Overwrite**: Nodes and edges referenced by the structure are force-refreshed from Firebase to overwrite any stale cache data.

## Hydration Pipeline
The CDAG load path follows a strict sequence for fast render and accurate data:
1. **Cache Hydration**: IndexedDB restores the last known CDAG snapshot.
2. **Manifest Overwrite**: `users/{uid}/graphs/cdag_topology/graph_metadata/topology_manifest` is fetched and applied.
3. **Live Structure Sync**: A Firebase snapshot subscription keeps the manifest up to date.
4. **Detail Expansion**: The graph fetches the full node/edge collections once per app load, then only re-fetches when the data is stale (30-minute TTL).

Implementation references:
- Sync hook: [src/hooks/use-cdag-structure.ts](../../src/hooks/use-cdag-structure.ts)
- Store cache logic: [src/stores/cdag-topology/store.ts](../../src/stores/cdag-topology/store.ts)
- Firebase service: [src/lib/firebase/graph-service.ts](../../src/lib/firebase/graph-service.ts)

## Highlighting System
- **Primary Selection**: Selected nodes receive an **Indigo Glow Aura** and bold stroke.
- **Relationship Tracing**: Immediate parents and children of selected nodes are highlighted with indigo strokes, and the connecting edges turn solid indigo to reveal the specific flow of effort.
- **Context Preservation**: Unselected nodes remain visible at full opacity to provide consistent navigation context.