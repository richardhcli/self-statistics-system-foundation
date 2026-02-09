
# cdagTopology: The Neural Source of Truth

The `cdagTopology` is the logical structural backbone of the application.
All topology utilities (merge, checks, propagation) are implemented in `lib/soulTopology`.

## 🧠 Core Architecture

The topology is a **Weighted Directed Acyclic Graph (DAG)** stored with a **Hybrid Read-Aside** pattern.
Firebase is the source of truth; Zustand + IndexedDB cache data for fast reads.

Firebase access lives in [src/lib/firebase/graph-service.ts](../src/lib/firebase/graph-service.ts). The cache schema is defined in [src/stores/cdag-topology/types.ts](../src/stores/cdag-topology/types.ts).

## 📚 Firestore Collections
- **graph_metadata/topology_manifest**: Lightweight topology manifest (node summaries + weighted adjacency).
- **nodes**: Full node documents.
- **edges**: Full edge documents.

### Data Structure
See the authoritative types in [src/stores/cdag-topology/types.ts](../src/stores/cdag-topology/types.ts).

## 🏷 Classification Logic
- **Actions**: Real-world activities. They are the sources of EXP.
- **Skills**: Middle-management nodes. They aggregate experience from multiple actions.
- **Characteristics**: Top-level roots. They represent the abstract nature of the user's effort.

## 🤖 Adaptive Learning
Edge weights are adjusted via the `mergeTopology` logic using a global `LEARNING_RATE` (implemented in `lib/soulTopology`).
1. **Fragments**: AI generates small hierarchy fragments from entries.
2. **Convergence**: Fragments merge into the main topology. If an edge already exists, its weight shifts slightly toward the new predicted value, allowing the brain to learn user patterns over months of use.

## 📈 Integration
- **Graph Layout**: Uses structure adjacency for fast layout, then enriches with node/edge details on demand.
- **EXP Engine**: Uses the weighted hierarchy to calculate back-propagation intensities.

## 🔄 Read-Aside Flow
1. UI requests graph data via selectors (nodes/edges/structure).
2. Store checks cache metadata; if stale, it fetches from Firebase.
3. Manifest document loads first to hydrate node summaries and weighted adjacency.
4. Node/edge details load on-demand via smart fetch, with a full graph sync once per app load and only when stale afterwards.

## 🧩 Sync + Cache Pipeline
1. **Session Boot**: IndexedDB hydrates cached nodes/edges/structure immediately.
2. **Manifest Fetch**: Load `graph_metadata/topology_manifest` to refresh summaries + adjacency.
3. **Manifest Subscription**: Listen for manifest updates to keep structure current.
4. **Full Detail Sync**: Fetch all nodes + edges once per app load, then only if stale (30-minute TTL).
5. **Targeted Refresh**: Fetch node/edge details referenced by the manifest to overwrite stale cache entries.
