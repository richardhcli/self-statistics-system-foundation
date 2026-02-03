# AI Guidelines for Self-Statistics System

**Last Updated**: February 2, 2026  
**Target Audience**: AI Agents (GitHub Copilot, Claude, etc.)  
**Purpose**: Concise, token-efficient reference for maintaining architectural consistency.

---

## 1. Project Philosophy: Local-First, Sync-Behind

This is a **Local-First, Sync-Behind** React application (using Vite + TypeScript + Zustand).

- **Primary Truth**: IndexedDB in the browser (offline-first)
- **UI Pattern**: Always optimistic—never wait for network before updating UI
- **Write Flow**: Component action → Zustand store → IndexedDB (immediate) → Server (background)
- **Architecture Pattern**: Bulletproof React (modular features, clear separation of concerns)

### Key Principles
1. **Data persists locally first**; network sync is asynchronous.
2. **Code is the source of truth for logic**; IndexedDB stores data only.
3. **All features are isolated** and coordinate via orchestrator hooks.

---

## 2. Directory Structure & Responsibilities

```
src/
├── app/                  # Root entry point (app.tsx, provider.tsx)
├── features/            # Domain-specific modules (each self-contained)
│   ├── journal/         # Voice recording, hierarchical entries, AI analysis
│   ├── visual-graph/    # D3-based DAG visualization (Concept Graph)
│   ├── developer-graph/ # Architectural hierarchy editor
│   ├── statistics/      # User progression dashboards
│   ├── settings/        # Profile and configuration
│   └── [other]/
├── lib/                 # Pure logic and utilities ("Engine")
│   ├── soulTopology/    # Core algorithms (topology building, EXP propagation)
│   ├── persist-middleware.ts
│   └── [utilities]/
├── stores/              # Global state management ("State")
│   ├── journal/         # Journal entries store
│   ├── cdag-topology/   # Graph topology store
│   ├── player-statistics/  # EXP and progression
│   ├── user-information/   # User profile and metadata
│   ├── ai-config/       # AI processing configuration
│   ├── user-integrations/  # External integrations
│   └── root/            # Composition store (serialization only)
├── hooks/               # Cross-cutting orchestrators and utilities
│   ├── use-entry-orchestrator.ts  # Multi-store coordination
│   ├── use-persistence.ts         # Hydration from IndexedDB
│   └── [others]/
└── types/               # Global TypeScript types
```

---

## 3. State Management: The Separated Selector Facade Pattern

### 3.1 Zustand Store Structure

Every store follows this pattern:

```typescript
// stores/[domain]/store.ts (PRIVATE - never export directly)
interface StoreState {
  // PURE DATA only (will be persisted to IndexedDB)
  data: DataShape;
  metadata?: MetadataShape;

  // LOGIC only (stable references, never persisted)
  addItem: (item: Item) => void;
  updateItem: (id: string, updates: Partial<Item>) => void;
  // ... other mutations
}

export const useXyzStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: {/* initial state */},
      addItem: (item) => set(state => ({ data: {...state.data, [item.id]: item} })),
      // ...
    }),
    {
      name: 'xyz-store-v1',
      storage: indexedDBStorage,
      partialize: (state) => ({ data: state.data, metadata: state.metadata }), // ✅ Never persist functions
    }
  )
);
```

### 3.2 Public Hook Exports (Always Use These)

Every store **must** export exactly two hooks:

```typescript
// stores/[domain]/hooks.ts

// 1. STATE HOOK: For reading data (fine-grained selectors prevent unnecessary re-renders)
export const useXyzData = () => useXyzStore(state => state.data);
export const useXyzItem = (id: string) => useXyzStore(state => state.data[id]);

// 2. ACTIONS HOOK: For mutations (stable object reference—never triggers re-render)
export const useXyzActions = () => useXyzStore(state => ({
  addItem: state.addItem,
  updateItem: state.updateItem,
  // ... only the mutation methods
}));
```

### 3.3 Consumption Pattern

```typescript
// In components or orchestrators
const items = useXyzData();  // Re-renders only when items change
const { addItem } = useXyzActions();  // Stable reference—never causes re-render
```

**Rule**: Never import the internal store (`useXyzStore`) directly. Always use the public hooks.

---

## 4. Data Persistence: Local-First, IndexedDB as Master

### 4.1 Persistence Rules

1. **IndexedDB stores data only**—never functions, actions, or getters.
2. Use `partialize` to whitelist serializable keys.
3. Use `idb-keyval` for async, non-blocking storage.
4. Each store independently persists (e.g., `journal-store-v1`, `cdag-topology-store-v1`).

**Why?** Functions serialize poorly, stale code from disk is dangerous, and storage bloats quickly.

### 4.2 Hydration

Use the `usePersistence` hook to wait for all stores to hydrate:

```typescript
export const useHydrationStatus = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  useEffect(() => {
    // Trigger store hydration and wait
    Promise.all([/* store promises */]).then(() => setIsInitialized(true));
  }, []);
  return { isInitialized };
};
```

---

## 5. The "Engine vs. State" Split: /lib vs /stores

### 5.1 /lib: Pure Logic (The "Engine")

Place all pure, domain-specific logic here:

- ✅ Algorithms (topology building, EXP propagation, graph traversals)
- ✅ Type definitions and domain constants
- ✅ Data transformations (never mutate input; return new structures)
- ❌ NO imports from `@/stores`
- ❌ NO React hooks or Zustand calls
- ❌ NO side effects

```typescript
// lib/soulTopology/buildTopology.ts
export const buildIncomingTopologyFromActions = (
  actions: string[],
  currentGraph: GraphState
): GraphState => {
  // Pure function: takes data, returns new data
  // No access to stores, no mutations
};
```

### 5.2 /stores: State Management (The "State")

Handle persistence, state mutations, and persistence coordination:

- ✅ Import types and utilities from `/lib`
- ✅ Define Zustand stores with `persist` middleware
- ✅ Use `partialize` to whitelist only data
- ✅ Implement Pattern C (Separated Selector Facade)
- ❌ NO complex business logic (delegate to `/lib`)

```typescript
// stores/cdag-topology/store.ts
import { buildIncomingTopologyFromActions } from '@/lib/soulTopology';

// Inside store actions:
updateTopology: (actions: string[]) => {
  const fragment = buildIncomingTopologyFromActions(actions, get().graph);
  set(state => ({ graph: mergeGraphs(state.graph, fragment) }));
}
```

---

## 6. Cross-Store Orchestration: The Orchestrator Hook Pattern

When a business process spans multiple stores (e.g., creating a journal entry that updates topology AND stats AND user info), **never do it in a component**. Use an **Orchestrator Hook**.

### 6.1 Orchestrator Structure

```typescript
// hooks/use-entry-orchestrator.ts
export const useEntryOrchestrator = () => {
  // 1. Consume action hooks (stable references)
  const journalActions = useJournalActions();
  const { updateStats } = usePlayerStatisticsActions();
  const graphActions = useGraphActions();

  // 2. Consume state selectors ONLY when needed for calculations
  const nodes = useGraphNodes();

  // 3. Define the orchestration function
  const applyEntryUpdates = useCallback(
    async (dateKey: string, entryText: string) => {
      // Call lib logic
      const topologyFragment = transformActionsToTopology(entryText, nodes);
      const statsUpdate = calculateParentPropagation(topologyFragment, nodes);

      // Dispatch updates (React 18+ batches these automatically)
      journalActions.upsertEntry(dateKey, entry);
      graphActions.setGraph(topologyFragment);
      updateStats(statsUpdate);
      // → Single re-render
    },
    [journalActions, updateStats, graphActions, nodes]
  );

  return { applyEntryUpdates };
};
```

### 6.2 Orchestrator Rules

- **Never nest orchestrators** (Orchestrator A should not call Orchestrator B).
- **Validate types** between stores (use TypeScript strict mode).
- **Wrap in try-catch** to prevent cascading store corruption.
- **Use GraphState consistently**: All topology operations must use `GraphState` type.
- **Leverage React 18+ batching**: Multiple synchronous store updates = single re-render.

---

## 7. Component Composition & Feature Isolation

### 7.1 Feature Structure

Each feature (e.g., `/features/journal/`) is a self-contained module:

```
features/journal/
├── components/     # UI components (never import from other features)
├── hooks/          # Feature-specific UI logic (useState, useMemo)
├── types.ts        # Feature-local types (extending /lib types as needed)
└── index.ts        # Public exports only
```

### 7.2 Rules

- **No cross-feature imports** (except through `/lib` or central orchestrators).
- **Use "Slots" for composition**: Pass UI components as props to prevent hard coupling.
- **Local state for UI only**: `useState` for `isOpen`, form inputs, animations, etc.
- **Global state for persistence**: Use Zustand only if data must survive a page refresh or is needed by >2 unrelated features.

### 7.3 Derived State (useMemo)

Never sync local state with global state via `useEffect`. Derive instead:

```typescript
// ✅ GOOD: Derive from global selector
const activeItem = useMemo(
  () => items.find(item => item.id === selectedId),
  [items, selectedId]
);

// ❌ BAD: Syncing local state (causes stale data bugs)
useEffect(() => {
  setActiveItem(items.find(item => item.id === selectedId));
}, [items, selectedId]);
```

---

## 8. Type Safety & GraphState

### 8.1 GraphState Definition

All topology operations use the unified `GraphState` type:

```typescript
interface GraphState {
  nodes: Record<string, NodeData>;
  edges: Record<string, EdgeData>;
  version: number;
}
```

**Rule**: All utilities in `/lib/soulTopology` expect `GraphState` input and return `GraphState` fragments. No legacy formats.

### 8.2 Validation

Always ensure data passed between stores matches expected types:

```typescript
// ✅ Type-safe
const fragment: GraphState = buildTopology(/* ... */);
setGraph(fragment);

// ❌ Not type-safe (would fail in strict mode)
const topology = { nodeId: { parents: {}, type: 'action' } };
```

---

## 9. Post-Modification Verification Workflow

After making changes, **always run**:

```bash
npm run lint          # ESLint (enforce style/patterns)
npm run build         # TypeScript compilation (catch type errors)
npm run test          # Unit tests (if applicable)
npm run dev           # Start dev server (manual testing)
```

---

## 10. Common Patterns & Anti-Patterns

### ✅ DO:

- Place pure algorithms in `/lib`.
- Export only public hooks from stores.
- Use orchestrator hooks for cross-store operations.
- Derive UI state from global selectors with `useMemo`.
- Whitelist only data in `partialize`.
- Use GraphState consistently for topology operations.

### ❌ DON'T:

- Export raw stores or internal implementations.
- Import from `@/stores` in `/lib`.
- Persist functions or actions to IndexedDB.
- Mix business logic into components.
- Create nested orchestrators.
- Sync state via `useEffect` (derive with `useMemo` instead).
- Wait for network before updating UI (always optimistic).

---

## 11. Further Resources

| Document | Purpose | When to Read |
|----------|---------|--------------|
| [GLOBAL_STATE.md](./state-management/GLOBAL_STATE.md) | Immutable store pattern reference | Implementing new stores |
| [ORCHESTRATOR_PATTERN.md](./state-management/ORCHESTRATOR_PATTERN.md) | Cross-store coordination guide | Multi-store business logic |
| [architecture.md](./architecture/architecture.md) | Folder structure & philosophy | Project onboarding |
| [architecture-lib-vs-stores.md](./architecture/architecture-lib-vs-stores.md) | Detailed /lib vs /stores rules | Refactoring or new features |
| [LOCAL_STATE.md](./state-management/LOCAL_STATE.md) | useState & feature hooks guide | UI-only state |
| [PERSISTENCE_ARCHITECTURE.md](./PERSISTENCE_ARCHITECTURE.md) | Deep dive into IndexedDB & Zustand | Persistence debugging |

---

## 12. Known Contradictions & Decisions Needed

⚠️ **Item 1: Store Method vs. Actions Object Pattern**
- **Documentation (GLOBAL_STATE.md)** prescribes grouping mutations into a stable `actions` object.
- **Implementation (journal, cdag-topology stores)** uses direct CRUD methods on the store.
- **Decision Needed**: Should new stores follow documented `actions` pattern or current implementation pattern?
- **Recommendation**: Verify with project lead and standardize going forward.

⚠️ **Item 2: Serialization Layer Usage**
- **Documentation** suggests `root` store handles all serialization for sync/export.
- **Implementation** shows stores handle their own persistence independently.
- **Decision Needed**: Should multi-store operations be wrapped by a serialization layer?
- **Recommendation**: Clarify use case for `root` store and document when/if it's used in runtime vs. export.

---

## Quick Reference for AI Prompts

**When you see a request to...**

| Request | Action | Reference |
|---------|--------|-----------|
| Add a new feature | Create in `/features`, use Pattern C for store, pure logic in `/lib` | Section 3-5 |
| Modify topology/graph logic | Update `/lib/soulTopology` (pure), then store actions in `/stores/cdag-topology` | Section 5 |
| Create cross-store logic | Build an Orchestrator Hook in `/hooks`, consume multiple action hooks | Section 6 |
| Add new global state | Create store with `persist` + `partialize`, export two hooks (data + actions) | Section 3 |
| Update component UI state | Use `useState` + `useCallback`; derive from global selectors with `useMemo` | Section 7 |
| Debug persistence | Check `partialize` whitelist, verify only data (not functions) is saved | Section 4 |
| Verify build status | Run `npm run lint && npm run build` | Section 9 |