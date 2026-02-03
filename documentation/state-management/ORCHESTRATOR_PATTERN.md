# Orchestrator Pattern Documentation

**Purpose**: Specification for coordinating multi-store updates  
**Audience**: Developers implementing cross-store business logic  
**Related**: [GLOBAL_STATE.md](./GLOBAL_STATE.md), [ai-guidelines.md](../ai-guidelines.md#6-cross-store-orchestration-the-orchestrator-hook-pattern)

---

## Overview
Orchestrators coordinate multi-store updates in a single business operation. They implement the **Cross-Store Coordination Pattern** described in the Global State Protocol.

## Pattern Structure

### 1. Stable Action References
Orchestrators consume action hooks from multiple stores. Because actions are stable references (never change), the orchestrator hook itself won't cause re-renders from action dependencies.

```typescript
export const useMyOrchestrator = () => {
  // Action hooks (stable references - won't trigger re-renders)
  const journalActions = useJournalActions();
  const { updateStats } = usePlayerStatisticsActions();
  const graphActions = useGraphActions();
  
  // State selectors (only when needed for calculations)
  const nodes = useGraphNodes();
  const edges = useGraphEdges();
  
  const orchestrateUpdate = useCallback(async (data) => {
    // Perform coordinated updates
    // React 18+ batches these automatically
    journalActions.upsertEntry(key, entry);
    updateStats(exp);
    graphActions.addNode(node);
  }, [journalActions, updateStats, graphActions, nodes, edges]);
  
  return { orchestrateUpdate };
};
```

### 2. Type Safety with GraphState

**Modern Format Only:** The codebase uses `GraphState` format exclusively:

```typescript
interface GraphState {
  nodes: Record<string, NodeData>;
  edges: Record<string, EdgeData>;
  version: number;
}
```

**Rule:** All topology operations use GraphState. All utility functions return GraphState fragments.

**Example:**
```typescript
const topologyFragment = buildIncomingTopologyFromActions(actions, currentGraph);
// topologyFragment is GraphState with .nodes and .edges
```

### 3. React 18+ Automatic Batching

Orchestrators leverage React 18's automatic batching. Multiple state updates within an async function result in a single re-render:

```typescript
const orchestrate = useCallback(async (data) => {
  // All these updates batch automatically in React 18+
  await processData(data);
  storeA.update(resultA);
  storeB.update(resultB);
  storeC.update(resultC);
  // → Single re-render
}, [storeA, storeB, storeC]);
```

## Best Practices

1. **Never Nest Orchestrators:** One orchestrator should not call another. If you need composition, extract shared logic to a utility function.

2. **Validate Input Types:** Always ensure data passed between stores matches expected formats. Use TypeScript strict mode.

3. **Error Boundaries:** Wrap orchestrator operations in try-catch to prevent cascading store corruption:

```typescript
const orchestrate = useCallback(async (data) => {
  try {
    await processRiskyOperation(data);
    storeA.update(result);
  } catch (error) {
    console.error('Orchestration failed:', error);
    // Optional: Revert partial updates or show error UI
  }
}, [storeA]);
```

4. **Always Use GraphState:** All topology functions expect and return GraphState:

```typescript
// ✅ CORRECT
const fragment: GraphState = buildTopology(actions, currentState);
mergeGraphs(currentState, fragment);

// ❌ WRONG - No legacy types exist
const topology = { nodeId: { parents: {}, type: 'action' } }; // Compile error
```

## Anti-Patterns

❌ **Using undefined properties:**
```typescript
const nodes = graphState.topology; // Wrong! Use .nodes
```

❌ **Mixing data structures:**
```typescript
setGraph({
  nodes: someOtherFormat, // Must be Record<string, NodeData>
  edges: {},
  version: 2
});
```

✅ **Correct approach:**
```typescript
const fragment = buildIncomingTopologyFromActions(actions, currentGraph);
setGraph({
  nodes: { ...currentNodes, ...fragment.nodes },
  edges: { ...currentEdges, ...fragment.edges },
  version: 2
});
```

## Related Documentation

- [Global State Protocol](./GLOBAL_STATE.md) - Core patterns
- [State Management README](./state-management-README.md) - Architecture overview
- Graph Store Types: [src/stores/cdag-topology/types.ts](../../src/stores/cdag-topology/types.ts)
