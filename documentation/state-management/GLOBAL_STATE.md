# Global State Protocol (Zustand) - IMMUTABLE STANDARD

**Status**: Immutable reference document  
**Purpose**: Authoritative specification for all Zustand store implementations  
**Last Updated**: February 1, 2026  
**Related**: See [ai-guidelines.md](../ai-guidelines.md) for quick reference and project integration 

## Overview
This project utilizes the **Separated Selector Facade Pattern** for all global stores. This architecture ensures high performance by maintaining reference stability, preventing unnecessary re-renders, and avoiding the "Maximum update depth exceeded" errors common in large-scale React applications.

## 1. Core Architecture: Separated Selector Facade Pattern
Every global store must be private and exposed only through two specific hook types to decouple component logic from the underlying state engine.

### Layer 1: The Private Internal Store
Defined in a `store.ts` file, this internal store is **never** exported directly. All state mutations must be grouped into a stable `actions` object within the store to ensure they do not change during the application lifecycle.

```typescript
// Internal Store Definition (Private)
const useStore = create(persist((set) => ({
  data: {}, // Serializable state
  actions: { // Stable action references
    updateData: (payload) => set(state => ({ 
      data: { ...state.data, ...payload } 
    })),
  }
}), { 
  name: 'feature-domain-storage',
  // Ensure IndexedDB ONLY stores data, never functions or actions
  partialize: (state) => ({ data: state.data }) 
}));
```

### Layer 2: The State Hook (Data Selectors)

Export a public hook that utilizes fine-grained selectors. This allows components to subscribe to specific "slices" of data, ensuring they only re-render when their relevant data actually changes.

```typescript
// Public State Hook
export const useFeatureData = () => useStore(state => state.data);

// Atomic Selector (Optimal for performance)
export const useFeatureItem = (id: string) => useStore(state => state.data[id]);

```

### Layer 3: The Actions Hook (Logic Facade)

Export a dedicated hook for state mutations. Because this hook returns a reference to the static `actions` object, components using it will **never** re-render when the store data updates.

```typescript
// Public Actions Hook
export const useFeatureActions = () => useStore(state => state.actions);

```

## 2. Persistence & Hydration Rules

* **Firebase as Master**: For cloud-backed domains, Firestore is the source of truth and IndexedDB is the persistent cache.
* **Asynchronous Storage**: Use `idb-keyval` as the storage engine to prevent blocking the UI thread during disk I/O.
* **Pure Data Isolation**: Always use the `partialize` middleware option to whitelist data keys. Never persist functions, utility objects, or actions to IndexedDB.
* **Schema Migrations**: Implement the `version` and `migrate` properties. Prefer non-destructive transforms, but cache-only stores may clear on incompatible versions.

## 3. Data Normalization

* **Flat Records**: Store complex structures like graphs or lists as `Record<string, T>` lookup tables rather than nested arrays.
* **Reference Stability**: Normalization allows atomic updates. Changing one node in a map does not mutate the reference of other items in that map, significantly optimizing React's reconciliation cycle.

## 4. Cross-Store Coordination

* **Orchestrator Hooks**: When a business process requires updating multiple stores (e.g., updating `Journal` and `PlayerStats` simultaneously), use a custom **Orchestrator Hook**.
* **Atomic Updates**: Orchestrator hooks leverage React 18+ automatic batching to ensure multiple store updates result in a single render cycle.