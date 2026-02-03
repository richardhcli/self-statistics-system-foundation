# AI Guidelines — Self-Statistics System

**Updated**: February 3, 2026 | **Stack**: Vite + React + TypeScript + Zustand + IndexedDB  
**Architecture**: [Bulletproof React](https://github.com/alan2207/bulletproof-react) | **Philosophy**: Local-First, Optimistic UI

---

## Quick Navigation

- **New stores?** → See [GLOBAL_STATE.md](./state-management/GLOBAL_STATE.md) + pattern below  
- **Cross-store logic?** → See [ORCHESTRATOR_PATTERN.md](./state-management/ORCHESTRATOR_PATTERN.md)  
- **Architecture details?** → See [architecture-lib-vs-stores.md](./architecture/architecture-lib-vs-stores.md)  
- **Persistence issues?** → See [PERSISTENCE_ARCHITECTURE.md](./PERSISTENCE_ARCHITECTURE.md)  

---

## Core Principles (Verified ✅)

| Principle | Implementation |
|-----------|-----------------|
| **Local-First** | IndexedDB as primary truth; Zustand stores hydrate on boot |
| **Optimistic UI** | Never wait for network; write → store → IDB (immediate) → server (async) |
| **File Naming** | Strict kebab-case (`voice-recorder.tsx`, `use-entry-orchestrator.ts`) |
| **Type Safety** | `GraphState` type for all topology ops; strict TypeScript mode |
| **Feature Isolation** | No cross-feature imports (only `/lib` or orchestrators bridge them) |

---

## Folder Responsibilities

```
src/
├── features/            # Domain modules (self-contained, no cross-imports)
├── stores/              # Zustand + persist + IndexedDB (data only in `partialize`)
├── lib/                 # Pure logic, types, constants (⚠️ NO store imports)
├── hooks/               # Orchestrators + UI utilities (cross-cutting concerns)
├── app/                 # Root provider & app.tsx
└── types/               # Global TypeScript exports
```

---

## State Management Pattern (In Use)

### Zustand Store Structure

Every store: **data + actions → persist → IndexedDB**

```typescript
// stores/[domain]/store.ts
interface StoreState {
  data: Shape;  // Only persists this
  actions: { addItem: (x) => void; /* ... */ };  // Never persists
}

export const useXyzStore = create<StoreState>()(
  persist((set, get) => ({
    data: {},
    actions: { /* functions */ }
  }), {
    name: 'xyz-store-v1',
    storage: indexedDBStorage,
    partialize: (state) => ({ data: state.data })  // ✅ Whitelist only
  })
);
```

### Public Hooks (Always Use These)

```typescript
// Read data (fine-grained selectors prevent re-renders)
export const useXyzData = () => useXyzStore(s => s.data);

// Mutate (stable action object never triggers re-render)
export const useXyzActions = () => useXyzStore(s => s.actions);
```

**Rule**: Never import `useXyzStore` directly; always use public hooks.

---

## /lib vs /stores (The Engine-State Split)

| **In /lib** | **In /stores** |
|----------|----------|
| ✅ Pure algorithms, types, constants | ✅ Zustand stores, persist config |
| ✅ Data transformations (immutable) | ✅ Import types from `/lib` |
| ❌ NO Zustand or React hooks | ❌ NO complex business logic |
| ❌ NO store imports | ❌ NO side effects beyond mutations |

**Example**: `lib/soulTopology/buildTopology.ts` computes new `GraphState`; store action wraps it.

---

## Cross-Store Orchestration

For multi-store business logic (journal entry → topology update → stats), use **Orchestrator Hooks**:

```typescript
// hooks/use-entry-orchestrator.ts
export const useEntryOrchestrator = () => {
  const journalActions = useJournalActions();  // Action hooks (stable)
  const nodes = useGraphNodes();               // Selectors (only for calcs)
  
  const applyUpdates = useCallback(
    (data) => {
      const fragment = libFunction(data, nodes);
      journalActions.upsert(...);  // React 18+ batches these
      graphActions.setGraph(fragment);
    },
    [journalActions, nodes]
  );
  return { applyUpdates };
};
```

**Rules**:  
- No nested orchestrators  
- Wrap in try-catch  
- Use `GraphState` consistently  

---

## Verification Checklist

After changes, run:

```bash
npm run lint    # Style + pattern enforcement
npm run build   # TypeScript strict mode
npm run dev     # Manual testing
```

---

## Common Patterns

✅ **DO**: Use selectors for reads | Export public hooks | Derive UI state with `useMemo` | Place pure logic in `/lib`

❌ **DON'T**: Persist functions | Import stores in `/lib` | Mix logic into components | Wait for network before UI update

---

## Persistence Isolation (Location Reference)

**Zustand Persist Middleware**: [src/stores/root/persist-middleware.ts](src/stores/root/persist-middleware.ts)  
- Bridges individual store state ↔ IndexedDB  
- ⚠️ Restricted: Never import in features; Zustand calls automatically  

**Root State DB Layer**: [src/stores/root/db.ts](src/stores/root/db.ts)  
- Manual serialization/deserialization layer for full state snapshots  
- ⚠️ Restricted: Use only during hydration, import/export, recovery  
- Must use `serializeRootState()` and `deserializeRootState()` for all operations
