# Graph Store Architecture Migration - Implementation Notes

**Date**: February 1, 2026  
**Status**: Documentation Updated - Awaiting Implementation Decisions

## Summary

The STATE_MANAGEMENT_V2.md has been updated with the new **Local-First Graph Store Architecture** specification. This replaces the current nested cdag-topology structure with a flat, normalized node-edge lookup table schema optimized for O(1) performance and React rendering efficiency.

## What Changed in Documentation

### 1. Updated cdag-topology Store Description
- Changed from: Nested `Record<string, CdagNodeData>` with implicit parent relationships
- Changed to: Flat schema with `Record<string, NodeData>` and `Record<string, EdgeData>`
- Added explicit IndexedDB persistence layer with idb-keyval
- Added non-destructive migration strategy

### 2. Added Three-Tier Architecture
```
Local IndexedDB (Master) → Zustand Store (Cache) → Components (Atomic Selectors)
```

### 3. Hook API Pattern (Pattern C Applied to Graphs)
- **Selectors**: `useGraphNodes()`, `useGraphEdges()`, `useGraphNode(id)` - fine-grained reads
- **Actions**: `useGraphActions()` - mutation functions (stable references)
- **Derived**: `useAdjacencyList()`, `useDfsTraversal()` - wrapped in useMemo()

### 4. Key Performance Rules
- ✅ All graph traversals wrapped in `useMemo()` to prevent expensive recalculations
- ✅ Atomic selectors (`state => state.nodes`) prevent cascading re-renders
- ✅ Flat Record schema enables reference-stable updates
- ✅ No nested children = no deep-clone performance hits

## ⚠️ Critical Questions Requiring Decisions

### ✅ Question 1: Migration Strategy for Existing Data
**Decision**: Do not worry about legacy code. Make immediate changes. All user data migrations will be handled elsewhere.

**Implementation**: Clean implementation without backward compatibility concerns.

---

### ✅ Question 2: Computed vs Stored Properties
**Decision**: Option A - Compute `level` on-the-fly during traversals (always fresh). However, level is not a node property—only node characteristics (type, label, etc.) matter, determined at node creation.

**Implementation**: Remove `level` from NodeData. Compute only when needed for UI layout (e.g., DAG rendering).

---

### ✅ Question 3: Developer Graph Integration Timeline
**Decision**: Migrate immediately. Remove dual-pattern support.

**Implementation**: Update developer-graph-view.tsx to use new atomic selectors directly (useGraphNodes, useGraphEdges, useGraphActions).

---

### ✅ Question 4: Visual Graph - Independent or Synced?
**Decision**: Visual-graph is completely independent. It will ONLY change node visual positions (stored in its own datastore). cdag-topology stores ONLY:
- Node characteristics (type, label)
- Node topology (edges/relationships)
- NEVER node (x, y) positions

**Implementation**: 
- visual-graph/store: Manages `Record<nodeId, { x: number; y: number }>`
- cdag-topology/store: Manages node types and edges
- No sync between them; they are separate domains

---

### ✅ Question 5: Server Sync Protocol
**Decision**: 
- **Sync Trigger**: Manual - explicit save button
- **Conflict Resolution**: Last-write-wins (local overwrites server)
- **Error Handling**: Offline-first with queue
- **Real-time sync**: Will be implemented LATER
- **Endpoint**: POST `/api/graph` with the GraphState

**Implementation**: 
- Middleware for queuing offline mutations
- Save button triggers explicit sync
- Retry mechanism with exponential backoff when online

---

## Implementation Checklist

### Phase 1: Types & Store Setup
- [ ] Update `types.ts` with NodeData, EdgeData, GraphState interfaces
- [ ] Implement store.ts with idb-keyval persistence
- [ ] Create migration function for existing topology data
- [ ] Update index.ts with new selectors (useGraphNodes, useGraphEdges, useGraphActions)

### Phase 2: Developer Graph Integration
- [ ] Update developer-graph-view.tsx to use atomic selectors
- [ ] Remove manual topology → nodes/edges conversion
- [ ] Test UI still works with new store structure
- [ ] Verify EditorSidebar receives correct props

### Phase 3: Visual Graph Sync
- [ ] Decide: independent or synced?
- [ ] Implement sync strategy (if synced)
- [ ] Test graph editing workflows

### Phase 4: Server Sync
- [ ] Define sync protocol (trigger, conflict resolution, error handling)
- [ ] Implement sync middleware
- [ ] Add offline queue management
- [ ] Test network scenarios (offline, errors, conflicts)

### Phase 5: Testing & Migration
- [ ] Unit tests for graph traversals (DFS, BFS, etc.)
- [ ] Integration test for IndexedDB persistence
- [ ] Data migration test (old → new schema)
- [ ] Performance benchmark (O(1) lookups vs nested)

---

## References

**See documentation**:
- [STATE_MANAGEMENT_V2.md](./STATE_MANAGEMENT_V2.md#local-first-graph-store-architecture) - Full architectural details
- [CDAG Topology Types](../src/stores/cdag-topology/types.ts) - Current implementation
- [Developer Graph View](../src/features/developer-graph/components/developer-graph-view.tsx) - Current usage

**External**: 
- [idb-keyval](https://github.com/jakearchibald/idb-keyval) - IndexedDB wrapper
- [Zustand Persist Middleware](https://github.com/pmndrs/zustand#persist-middleware) - Store persistence

---

## Next Steps

1. **Review & Approve**: Confirm all 5 decisions above
2. **Prioritize**: Which phase to implement first?
3. **Schedule**: Estimate timeline for each phase
4. **Communicate**: Share decisions with team for implementation

Please provide answers to the 5 critical questions in the ⚠️ section above.
