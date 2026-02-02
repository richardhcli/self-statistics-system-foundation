
---

### 3. Local State Protocol (React)
`state-management/LOCAL_STATE.md`

This file governs transient, component-level state.

```markdown
# Local State Protocol (useState & Feature Hooks)

## Usage Criteria
Use Local State ONLY for:
1. **UI Status**: `isOpen`, `isProcessing`, `activeTab`.
2. **Form State**: Temporary input values before submission.
3. **Animations**: View-specific coordinates (e.g., D3 drag state).

## Implementation Patterns

### 1. Feature-Specific Local Hooks
When a feature has complex UI logic that isn't shared globally, create a local feature hook.

```typescript
// features/visual-graph/hooks/use-graph-ui.ts
export const useGraphUI = () => {
  const [zoom, setZoom] = useState(1);
  const handleZoom = useCallback((level) => setZoom(level), []);
  return { zoom, handleZoom };
};

```

### 2. State Lifting

If two components need to share UI state, lift the `useState` to their nearest common parent. Do not migrate to Zustand unless the state needs to persist across page navigations or affects distant features.

### 3. Derived State (useMemo)

Never sync local state with global state via `useEffect`. Instead, derive local values directly from global selectors.

* **Rule**: If a value can be calculated from props or a global store, use `useMemo`.
* **Graph Utility**: All graph traversals (DFS/BFS) must be wrapped in `useMemo` in the local component layer.

## AI Interaction Guidelines

* **Preference**: Default to `useState`. Only suggest Zustand if the data needs to survive a refresh or is needed by >3 unrelated features.
* **Performance**: Ensure `useCallback` is used for setters passed to children to prevent unnecessary re-renders of heavy UI components.