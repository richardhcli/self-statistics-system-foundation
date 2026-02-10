This document outlines the **Component Composition Strategy** within the context of **Bulletproof React** architecture and **Zustand** state management.

---

# Architecture Guide: Feature Composition Strategy

## 1. Core Principle: Inversion of Control

To prevent circular dependencies and maintain "Vertical Slices," features should not tightly couple their internal logic. Instead of Feature A hard-importing Feature B, we use **Composition** to inject Feature B into Feature A at the **Page** or **App** level.

## 2. Patterns

### A. The "Slot" Pattern (Recommended)

Used when a feature acts as a layout or container for other domain-specific components.

**Feature Implementation (`features/debug`):**

```tsx
// src/features/debug/components/debug-layout.tsx
interface DebugLayoutProps {
  contentSlot: React.ReactNode;
  metadataSlot?: React.ReactNode;
}

export const DebugLayout = ({ contentSlot, metadataSlot }: DebugLayoutProps) => (
  <section className="debug-root">
    <div className="debug-sidebar">{metadataSlot}</div>
    <div className="debug-main">{contentSlot}</div>
  </section>
);

```

### B. The "Children" Pattern

The simplest form of composition for wrapping features in providers or UI shells.

```tsx
// src/features/debug/components/debug-provider.tsx
export const DebugProvider = ({ children }: { children: React.ReactNode }) => {
  const debugStore = useDebugStore(); // Local feature store
  return <div data-debug-mode={debugStore.enabled}>{children}</div>;
};

```

---

## 3. Zustand State Integration

When features are composed, state management remains **decoupled**:

1. **Isolation:** Features use global Zustand stores from `src/stores/` (e.g., `cdag-topology`, `player-statistics`). Feature-local stores are avoided; state that crosses components goes in global stores.
2. **Consumption:** The component injected into a "Slot" retains access to its original store hooks.
3. **Communication:** If `debug` needs to react to `developer-graph`, it should do so via a **callback prop** or by subscribing to the external store explicitly in a custom hook.
4. **Domain Systems:** Pure logic modules live in `src/systems/` (aliased as `@systems/*`). These are neither features nor stores — they are imported by both.

---

## 4. Implementation Example (Composition Root)

The **Composition Root** (usually in `src/routes` or `src/app`) is where the features meet.

```tsx
// src/app/admin-page.tsx
import { DebugLayout } from '@/features/debug';
import { DeveloperGraph } from '@/features/developer-graph';
import { GraphControls } from '@/features/developer-graph';

export const AdminPage = () => {
  return (
    <DebugLayout 
      contentSlot={<DeveloperGraph />} 
      metadataSlot={<GraphControls />} 
    />
  );
};

```
When asking an AI to build new features using this strategy, use the following rules:

* **Rule 1:** "Do not import components from other features directly into the internal `components/` folder."
* **Rule 2:** "If Feature A requires Feature B, create a 'Slot' prop (React.ReactNode) in Feature A."
* **Rule 3:** "Export the composed layout via the feature's `index.ts` (Public API)."
* **Rule 4:** "Ensure Zustand stores remain scoped to their respective feature folders."