# Debug View Fix - Separated Selector Facade Pattern Compliance

**Date:** February 1, 2026  
**Status:** ✅ Complete

## Problem

Debug view crashed with:
```
TypeError: useJournalStore.getState(...).getEntries is not a function
```

**Root Cause:** All stores were exposing getter methods in their actions objects, violating the **Separated Selector Facade Pattern** (immutable standard defined in GLOBAL_STATE.MD).

## Solution

### 1. Removed All Getter Methods from Stores

**Before (❌ Wrong):**
```typescript
interface StoreState {
  data: DataType;
  actions: {
    setData: (data: DataType) => void;
    getData: () => DataType;  // ❌ Violates pattern
  };
}
```

**After (✅ Correct):**
```typescript
interface StoreState {
  data: DataType;  // Access directly via getState().data
  actions: {
    setData: (data: DataType) => void;
  };
}
```

### 2. Fixed Serialization APIs

Updated all store APIs to access data directly:

**Files Modified:**
- [journal.ts](../src/stores/journal/api/journal.ts) - `getState().entries` instead of `getState().getEntries()`
- [stats.ts](../src/stores/player-statistics/api/stats.ts) - `getState().stats` instead of `getState().getStats()`
- [user-information/index.ts](../src/stores/user-information/index.ts) - `getState().info`
- [user-integrations/index.ts](../src/stores/user-integrations/index.ts) - `getState().integrations`
- [ai-config/index.ts](../src/stores/ai-config/index.ts) - `getState().config`

### 3. Updated Store Implementations

**Stores Cleaned:**
- [journal/store.ts](../src/stores/journal/store.ts) - Removed `getEntries()`, `getEntriesByDate()`
- [player-statistics/store.ts](../src/stores/player-statistics/store.ts) - Removed `getStats()`, `getNodeStats()`, `getTotalLevel()`
- [user-information/store.ts](../src/stores/user-information/store.ts) - Removed `getInfo()`, `getName()`, `getUserClass()`
- [user-integrations/store.ts](../src/stores/user-integrations/store.ts) - Removed `getIntegrations()`, `getConfig()`, `getObsidianConfig()`, `getLogs()`
- [ai-config/store.ts](../src/stores/ai-config/store.ts) - Removed `getConfig()`, `getModel()`, `getTemperature()`

### 4. Fixed Orchestrator Type Issues

Updated [use-entry-orchestrator.ts](../src/hooks/use-entry-orchestrator.ts) to pass complete GraphState with version property.

## Pattern Compliance

### Correct State Access

**In React Components:**
```typescript
const data = useFeatureData();  // Hook selector
const { update } = useFeatureActions();  // Hook actions
```

**In Non-React Code:**
```typescript
const data = useStore.getState().data;  // Direct property access
useStore.getState().actions.update(data);  // Direct action access
```

### What NOT to Do

```typescript
// ❌ Never create getter methods in actions
actions: {
  getData: () => get().data
}

// ❌ Never create getter utilities
export const getData = () => useStore.getState().getData();

// ❌ Never expose getters at store root
interface Store {
  getData: () => DataType;
}
```

## Documentation Updated

- [features-debug.md](../documentation/docs-features/features-debug.md) - Complete rewrite with pattern compliance
- [GLOBAL_STATE.MD](../documentation/state-management/GLOBAL_STATE.MD) - Already immutable (no changes needed)

## Verification

✅ TypeScript compilation: No errors  
✅ Debug view: Renders correctly  
✅ Persistence view: Displays state  
✅ Topology manager: Functions properly  
✅ All stores: Follow Separated Selector Facade Pattern  

## Benefits

1. **Type Safety:** Eliminates confusion about which methods exist
2. **Performance:** No unnecessary function wrapper overhead
3. **Clarity:** Single way to access state (direct property)
4. **Consistency:** All stores follow identical pattern
5. **Maintainability:** Less code, clearer intent

## Breaking Changes

⚠️ **For Internal Code Only** - No user-facing changes

**Developers:** Any code calling getter methods will fail. Replace with direct property access:

```typescript
// Before
const data = useStore.getState().actions.getData();

// After
const data = useStore.getState().data;
```

---

**Ideology:** "Always completely migrate: Completely remove and destroy all legacy files; backward compatibility is unnecessary and unneeded."

**Result:** Clean, consistent state management following immutable architectural standards.
