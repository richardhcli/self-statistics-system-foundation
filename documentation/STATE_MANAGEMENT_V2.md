# State Management Architecture v2.0

## Overview

This project uses a sophisticated layered approach to state management following **Bulletproof React** principles with independent Zustand stores and orchestrator patterns.

## Architecture Patterns

### Pattern C: Separated Selector Facades

All global stores follow **Pattern C** (Hybrid Selector/Action Separation):

```typescript
// ❌ NEVER: Direct store access
const stats = useStatsStore();

// ✅ ALWAYS: Separated hooks
const stats = usePlayerStatistics();           // State Hook (fine-grained selector)
const { updateStats } = usePlayerStatisticsActions();  // Actions Hook (stable functions)
```

**Why Pattern C?**
- **Prevents unnecessary re-renders**: Components using only actions won't re-render on data changes
- **Action stability**: Functions are stable references, ideal for button/dispatch components
- **Fine-grained control**: Selector pattern allows precise subscriptions

## Global Store Structure

All global stores are located in `/stores/` and follow this structure:

```
stores/
├── journal/              # Journal entries store
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # Type exports
│   ├── index.ts          # Public API
│   └── api/              # Serialization helpers
├── player-statistics/    # Experience and levels
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # NodeStats, PlayerStatistics
│   ├── index.ts          # Public API
│   ├── api/              # Serialization helpers
│   └── utils/            # Pure calculation functions
├── cdag-topology/        # Logical hierarchy graph store (Local-First)
│   ├── store.ts          # Zustand store with idb-keyval persist (private)
│   ├── types.ts          # GraphState (nodes/edges), NodeType, EdgeData
│   ├── index.ts          # Public API (useGraphNodes, useGraphEdges, useGraphActions)
│   ├── api/              # Serialization & migrations
│   └── utils/            # Graph traversal helpers (DFS/BFS wrapped in useMemo)
├── user-information/     # User profile and identity
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # UserInformation
│   └── index.ts          # Public API
├── ai-config/            # AI processing settings
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # AIConfig
│   └── index.ts          # Public API
├── user-integrations/    # External API configs and logs
│   ├── store.ts          # Zustand store (private)
│   ├── types.ts          # IntegrationStore
│   └── index.ts          # Public API
└── root/                 # Composition for serialization ONLY
    └── index.ts          # serializeRootState(), deserializeRootState()
```

### Store Isolation Principle

**✅ DO:**
- Each store manages its own domain independently
- Stores never import or depend on other stores
- Cross-store coordination happens via orchestrator hooks

**❌ DON'T:**
- Import one store inside another store
- Create circular dependencies between stores
- Access stores directly from utilities (use pure functions instead)

## Orchestration Pattern

### Orchestrator Hooks for Cross-Store Logic

When operations span multiple stores, use **orchestrator hooks**:

```typescript
// hooks/use-entry-orchestrator.ts
export const useEntryOrchestrator = () => {
  const topology = useCdagTopology();
  const { updateStats } = usePlayerStatisticsActions();
  const { updateMostRecentAction } = useUserInformationActions();
  const { upsertEntry } = useJournalActions();

  const applyEntryUpdates = useCallback((dateKey, entry, actions, duration) => {
    // Coordinate updates across multiple stores
    // React 18+ batches all updates into single render
    const { totalIncrease, levelsGained } = updateStats(scaledExpMap);
    updateMostRecentAction(actions[0]);
    upsertEntry(dateKey, entryData);
    
    return { totalIncrease, levelsGained };
  }, [topology, updateStats, updateMostRecentAction, upsertEntry]);

  return { applyEntryUpdates };
};
```

**Key Principles:**
- Utilities are **pure functions** (Data In → Data Out)
- Orchestrators consume multiple stores via hooks
- React 18+ automatic batching ensures atomic updates
- Keeps stores decoupled and testable

## Local-First Graph Store Architecture

### Overview: IndexedDB as Master Source of Truth

The **cdag-topology store** implements a local-first, IndexedDB-backed graph store optimized for high-performance graph operations:

```
Local IndexedDB (Master)
    ↓ (idb-keyval persist middleware)
 Zustand Store State
    ↓ (React 18 batching)
 Components (via atomic selectors)
    ↓ (Optimistic updates)
 Server (Backup/Sync)
```

### 1. Flat Normalization Schema: Node-Edge Lookup Tables

**Core Principle**: Avoid nested children. Use Record<K, V> for O(1) reference-stable lookups.

```typescript
// stores/cdag-topology/types.ts
export type NodeType = 'action' | 'skill' | 'characteristic' | 'none';

export interface NodeData {
  id: string;                    // Unique node identifier (slugified)
  label: string;                 // Human-readable label
  type: NodeType;                // Semantic categorization
  level?: number;                // Optional hierarchy depth (computed)
  metadata?: Record<string, any>; // Extensible properties
}

export interface EdgeData {
  id: string;                    // Unique edge identifier
  source: string;                // Source node ID (reference)
  target: string;                // Target node ID (reference)
  weight?: number;               // Edge weight/strength (0.1-1.0)
  label?: string;                // Optional edge label
}

export interface GraphState {
  nodes: Record<string, NodeData>;  // O(1) lookups by node ID
  edges: Record<string, EdgeData>;  // O(1) lookups by edge ID
  version: number;                  // Schema version for migrations
}
```

**Why Flat Normalization?**
- ✅ **Performance**: O(1) node/edge lookups and updates
- ✅ **Reference Stability**: Updating a single node doesn't mutate the edges object
- ✅ **Memory Efficiency**: Avoid deep clones on every update
- ✅ **Render Optimization**: Atomic selector subscriptions prevent cascading re-renders
- ✅ **Testability**: Easy shallow equality comparisons

### 2. Persistence Strategy: Local-First Sync

#### Source of Truth Hierarchy

1. **IndexedDB (Primary)**: Local-first, always available, master copy
2. **Zustand Store (Cache)**: In-memory working state, synced with IndexedDB
3. **Server (Backup)**: Durable remote backup, not queried during normal operations

#### Sync Direction: Local → Server

```typescript
// stores/cdag-topology/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { set, get } from 'idb-keyval';

const useGraphStore = create<GraphState & GraphActions>(
  persist(
    (set, get) => ({
      nodes: {},
      edges: {},
      version: 1,
      
      addNode: (node: NodeData) =>
        set(state => ({
          nodes: { ...state.nodes, [node.id]: node }
        })),
      
      updateNode: (nodeId: string, updates: Partial<NodeData>) =>
        set(state => ({
          nodes: {
            ...state.nodes,
            [nodeId]: { ...state.nodes[nodeId], ...updates }
          }
        })),
      
      addEdge: (edge: EdgeData) =>
        set(state => ({
          edges: { ...state.edges, [edge.id]: edge }
        })),
    }),
    {
      name: 'cdag-topology-store',
      storage: createJSONStorage(() => ({
        getItem: async (key) => get(key),
        setItem: async (key, value) => set(key, value),
        removeItem: async (key) => { /* idb-keyval clear */ },
      })),
      version: 1,
      migrate: (persistedState, version) => {
        // Non-destructive migrations
        // Preserve existing data during schema evolution
        if (version < 1) {
          return { ...persistedState, version: 1 };
        }
        return persistedState;
      },
    }
  )
);
```

**Migration Strategy** (Non-Destructive):
- ✅ Version all stored schemas
- ✅ Provide transformation functions for each version bump
- ✅ Never reset data on version mismatch
- ✅ Handle backward compatibility gracefully

### 3. React Integration: The Facade Pattern

#### Hook API: Atomic Selectors

```typescript
// stores/cdag-topology/index.ts

// ✅ Selector: Reading specific graph data (prevents unnecessary re-renders)
export const useGraphNodes = () => 
  useGraphStore(state => state.nodes);

export const useGraphEdges = () => 
  useGraphStore(state => state.edges);

export const useGraphNode = (nodeId: string) =>
  useGraphStore(state => state.nodes[nodeId]);

// ✅ Action Hook: Dispatching graph mutations
export const useGraphActions = () => {
  const addNode = useGraphStore(state => state.addNode);
  const updateNode = useGraphStore(state => state.updateNode);
  const addEdge = useGraphStore(state => state.addEdge);
  // ... more actions
  
  return { addNode, updateNode, addEdge };
};
```

#### Component Usage Pattern

```typescript
// ✅ Only re-renders when nodes change (not edges)
const nodes = useGraphNodes();

// ✅ Only re-renders when specific node changes
const myNode = useGraphNode('my-concept');

// ✅ Actions never cause re-renders (stable references)
const { addNode, updateNode } = useGraphActions();
<button onClick={() => addNode(newNode)}>Add</button>
```

#### Derived Computations: useMemo for Graph Traversals

```typescript
// features/developer-graph/hooks/use-graph-traversal.ts
import { useMemo } from 'react';
import { useGraphNodes, useGraphEdges } from '@/stores/cdag-topology';

export const useAdjacencyList = () => {
  const nodes = useGraphNodes();
  const edges = useGraphEdges();
  
  // Memoize expensive adjacency list computation
  // Only recalculates when nodes or edges change
  return useMemo(() => {
    const adj: Record<string, string[]> = {};
    
    Object.values(nodes).forEach(node => {
      adj[node.id] = [];
    });
    
    Object.values(edges).forEach(edge => {
      adj[edge.source]?.push(edge.target);
    });
    
    return adj;
  }, [nodes, edges]);
};

export const useDfsTraversal = (startNodeId: string) => {
  const adj = useAdjacencyList();
  const nodes = useGraphNodes();
  
  return useMemo(() => {
    const visited = new Set<string>();
    const result: string[] = [];
    
    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);
      result.push(nodeId);
      
      (adj[nodeId] || []).forEach(dfs);
    };
    
    dfs(startNodeId);
    return result;
  }, [adj, nodes, startNodeId]);
};
```

**Key Rules**:
- ✅ All graph traversals (DFS, BFS, shortest path) wrapped in `useMemo()`
- ✅ Dependencies must be atomic selectors (`state => state.nodes`), never full state
- ✅ Compute-heavy operations happen inside memos, not in render path
- ✅ Return values from memos should be stable references (objects with same structure)

## Feature-Specific State

### Local State with React Hooks

Features that don't need global sharing use local state:

```typescript
// features/visual-graph/store/index.ts
export const useVisualGraph = () => {
  const [graph, setGraph] = useState<VisualGraph>({ nodes: [], edges: [] });
  
  const updateNode = useCallback((nodeId, updates) => {
    setGraph(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => n.id === nodeId ? { ...n, ...updates } : n)
    }));
  }, []);

  return { graph, updateNode, addNode, removeNode };
};
```

**When to use local state:**
- UI-only state (animations, toggles, form inputs)
- Feature-specific data not shared across features
- Derived/computed visualization data (D3 graphs)

## Root Composition Store

The root store aggregates all stores **ONLY for serialization**:

```typescript
// stores/root/index.ts
export const serializeRootState = (): RootState => {
  return {
    journal: getJournalEntries(),
    cdagTopology: getCdagTopology(),
    playerStatistics: getPlayerStatistics(),
    userInformation: getUserInformation(),
    aiConfig: getAiConfig(),
    integrations: getUserIntegrations(),
  };
};
```

**⚠️ CRITICAL: Root store usage restrictions**
- ✅ Persistence (IndexedDB save/load)
- ✅ Import/Export operations
- ✅ Initial backend hydration
- ❌ NEVER use during runtime operations
- ❌ NEVER pass around as function parameter

## Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ Component Layer (React)                                  │
│  - Local state (useState)                                │
│  - Feature hooks (useVisualGraph)                        │
├─────────────────────────────────────────────────────────┤
│ Orchestrator Layer (Custom Hooks)                       │
│  - useEntryOrchestrator                                  │
│  - Coordinates cross-store updates                       │
├─────────────────────────────────────────────────────────┤
│ Store Layer (Zustand - Pattern C)                       │
│  - useJournal() / useJournalActions()                    │
│  - usePlayerStatistics() / usePlayerStatisticsActions()  │
│  - useCdagTopology() / useCdagTopologyActions()          │
│  - useUserInformation() / useUserInformationActions()    │
│  - useAiConfig() / useAiConfigActions()                  │
│  - useUserIntegrations() / useUserIntegrationsActions()  │
├─────────────────────────────────────────────────────────┤
│ Utilities Layer (Pure Functions)                        │
│  - calculateScaledProgression()                          │
│  - parseDurationToMultiplier()                           │
│  - updatePlayerStatsState()                              │
├─────────────────────────────────────────────────────────┤
│ Persistence Layer (IndexedDB)                           │
│  - serializeRootState()                                  │
│  - deserializeRootState()                                │
└─────────────────────────────────────────────────────────┘
```

## Usage Patterns

### Pattern 1: Reading State in Components

```typescript
// Fine-grained selector (only re-renders when specific data changes)
const progression = usePlayerStatistics(s => s.progression);
const userName = useUserInformation(s => s.name);

// Full state (re-renders on any change)
const journal = useJournal();
```

### Pattern 2: Dispatching Actions

```typescript
const { updateStats, addExperience } = usePlayerStatisticsActions();
const { updateName } = useUserInformationActions();

// These components ONLY re-render when clicked, not when data changes
<button onClick={() => updateName('New Name')}>Update</button>
```

### Pattern 3: Orchestrated Updates

```typescript
const { applyEntryUpdates } = useEntryOrchestrator();

// Coordinates journal, stats, and user info updates atomically
const handleSubmit = async () => {
  const result = applyEntryUpdates(dateKey, entry, actions, duration);
  console.log(`Gained ${result.totalIncrease} EXP`);
};
```

### Pattern 4: Utilities (Non-React)

```typescript
// ✅ Pure function - accepts data, returns data
export const calculateScaledProgression = (
  topology: CdagTopology,
  stats: PlayerStatistics,
  actions: string[],
  duration?: string
) => {
  // Pure calculation
  return { nextStats, totalIncrease, levelsGained };
};

// ❌ DON'T use hooks in utilities
// ❌ DON'T access stores directly
```

## Persistence & Hydration

### Independent Store Persistence

Each store can be persisted to its own IndexedDB table:

```typescript
// Save individual store
await db.put('journal', getJournalEntries());
await db.put('playerStatistics', getPlayerStatistics());

// Load individual store
const journal = await db.get('journal');
setJournalEntries(journal);
```

### Atomic State Export/Import

For full state operations, use root composition:

```typescript
// Export all state
const rootState = serializeRootState();
downloadJSON(rootState, 'backup.json');

// Import all state
const imported = parseJSON(fileContent);
deserializeRootState(imported);
```

## Migration from Legacy AppData

### Before (Deprecated)

```typescript
// ❌ Old pattern: AppData parameter passing
const result = applyScaledProgression(appData, actions, duration);
const updated = dataUpdater(appData, context, useAI);
```

### After (Current)

```typescript
// ✅ New pattern: Hook-based orchestration
const { applyEntryUpdates } = useEntryOrchestrator();
const result = applyEntryUpdates(dateKey, entry, actions, duration);

// ✅ New pattern: Pure utilities
const result = calculateScaledProgression(topology, stats, actions, duration);
```

## Best Practices

### ✅ DO

- Use Pattern C (separated selector/action hooks) for all global stores
- Keep utilities as pure functions
- Use orchestrator hooks for cross-store coordination
- Access stores via hooks in components
- Use `getState()` in non-React serialization code only

### ❌ DON'T

- Pass AppData/RootState as function parameters
- Call hooks inside utilities
- Create circular dependencies between stores
- Use Zustand for temporary UI state
- Access root composition store during runtime

## Why This Architecture?

1. **Modularity**: Each store is independent and testable
2. **Performance**: Fine-grained subscriptions prevent unnecessary re-renders
3. **Scalability**: Add new stores without affecting existing ones
4. **Type Safety**: Full TypeScript support with inference
5. **Debuggability**: Clear data flow and single source of truth
6. **Testability**: Pure functions and isolated stores
7. **Maintainability**: Explicit orchestration patterns

## ⚠️ Implementation Decisions Required

### Question 1: Current cdag-topology Structure → New NodeData/EdgeData

**Current Implementation** (types.ts):
```typescript
export type CdagTopology = Record<string, CdagNodeData>;
export interface CdagNodeData {
  parents: Record<string, number>;
  type: NodeType;
}
```

**New Specification** (flat schema):
```typescript
export interface NodeData {
  id: string;
  label: string;
  type: NodeType;
  metadata?: Record<string, any>;
}

export interface EdgeData {
  id: string;
  source: string;
  target: string;
  weight?: number;
}
```

**Decision Required**:
- ⚠️ How should parent relationships be migrated from implicit (`parents: Record`) to explicit edges?
- ⚠️ Should `level` be computed on-the-fly or stored in NodeData?
- ⚠️ What happens to bidirectional references (node knows parents, but edges have source/target)?

### Question 2: Persistence Integration

**Current**: No explicit IndexedDB sync specified in store.ts
**New**: Zustand + idb-keyval + migrations

**Decision Required**:
- ⚠️ Should existing app data be migrated to new schema automatically on first load?
- ⚠️ Should we keep a versioning/rollback strategy for incompatible changes?
- ⚠️ What is the sync interval for Local → Server? (Immediate? Batched? On-blur?)

### Question 3: Feature Integration - Developer Graph

**Current Usage** (developer-graph-view.tsx):
- Expects `useCdagTopology()` to return full topology object
- Converts topology to nodes/edges for EditorSidebar

**New Pattern**:
- `useGraphNodes()` / `useGraphEdges()` for atomic selectors
- Graph traversals wrapped in `useMemo()` in component hooks

**Decision Required**:
- ⚠️ Should developer-graph update to use new atomic selectors immediately or phase in gradually?
- ⚠️ What about derived data like `useAdjacencyList()` - should it be in cdag-topology utils or feature-specific?

### Question 4: Visual Graph vs CDAG Topology

**Current State**:
- `features/visual-graph`: Local state hook (useVisualGraph)
- `stores/cdag-topology`: Global logical hierarchy

**Relationship**:
- Should visual-graph derive from cdag-topology (read-only projection)?
- Or are they independent data models?

**Decision Required**:
- ⚠️ Is visual-graph purely for D3 rendering state, or should it sync back to cdag-topology when user makes edits?
- ⚠️ Should there be a syncing orchestrator between them?

### Question 5: Server Sync Protocol

**Current**: `getVisualGraph()` / `updateVisualGraph()` API endpoints exist
**New**: Local → Server direction

**Decision Required**:
- ⚠️ What triggers a server sync? (Auto-save interval? Explicit button? OnBlur?)
- ⚠️ How should conflicts be resolved if user edits locally while server has changes?
- ⚠️ Should graph mutations be optimistic or wait for server confirmation?
