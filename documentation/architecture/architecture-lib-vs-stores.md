# Architecture Protocol: /lib vs /stores

**Purpose**: Defines strict separation between pure logic and state management  
**Audience**: Developers implementing features or refactoring code  
**Related**: [ai-guidelines.md](../ai-guidelines.md#5-the-engine-vs-state-split-lib-vs-stores), [architecture.md](./architecture.md)

## Overview
This document defines the strict separation between **Pure Logic** (`/lib`) and **Global State** (`/stores`). This distinction is critical for maintaining a **Hybrid Read-Aside** system that is testable, reference-stable, and free of circular dependencies.
The `/lib` folder contains the domain's "Soul"—the pure math, algorithms, and data models.

### Core Responsibilities
* **Pure Functions**: Utilities must be "Data-In, Data-Out." They should never access a store directly.
* **Domain Types**: Defines the fundamental shape of entities (e.g., `NodeData`, `JournalEntry`).
* **Agnosticism**: Library code should not know it is being used in a React app or persisted to IndexedDB.

### Implementation Rules
* ❌ **NO** imports from `@/stores`.
* ❌ **NO** Zustand `create` calls or React hooks.
* ✅ **DO** define complex types and algorithms here.



---

## 2. The /stores Directory (The "State")
The `/stores` folder manages how data is held in memory, persisted to disk, and updated.

### Core Responsibilities
* **State Management**: Implements the **Separated Selector Facade Pattern** (Pattern C).
* **Persistence**: Configures `idb-keyval` and handles `partialize` to ensure only raw data is saved.
* **Glue Logic**: Actions in this layer call `/lib` utilities to perform computations.

### Implementation Rules
* ✅ **DO** import types and utilities from `@/lib`.
* ✅ **DO** group setters into a stable `actions` object.
* ✅ **DO** use `partialize` to whitelist only serializable data keys.



---

## 3. Type Definition Strategy

| Type Category | Location | Rationale |
| :--- | :--- | :--- |
| **Domain Models** | `/lib/[domain]/types.ts` | Shared source of truth for logic and state. |
| **Constants/Enums** | `/lib/[domain]/types.ts` | Prevents circular dependencies in utilities. |
| **Store State** | `/stores/[domain]/types.ts` | Describes implementation-specific memory structure. |
| **Action Signatures**| `/stores/[domain]/types.ts` | Defines how the store is mutated. |

---

## 4. Cross-Store Orchestration
When a utility needs data from multiple stores, it must be coordinated by an **Orchestrator Hook**.

1. **Orchestrator Hook**: Consumes multiple stores via the **Separated Selector Facade Pattern**.
2. **Fetch Data**: Retrieves current snapshots (e.g., `nodes` from Topology, `exp` from Stats).
3. **Execute Utility**: Passes those snapshots as arguments to the pure `/lib` utility.
4. **Apply Update**: Dispatches the result back to the relevant store actions.



## Summary for AI Prompt
"When creating new logic, define the core data models and pure algorithms in `/lib`. Implement the **Separated Selector Facade Pattern** in `/stores`, importing the `/lib` types and utilities to handle state updates. Ensure the store uses `partialize` to exclude actions from IndexedDB persistence."