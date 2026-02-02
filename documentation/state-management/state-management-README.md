# State Management General Style Guide
This file establishes the "Rules of Engagement" for the overall state architecture.


## Architecture Overview
This project follows a **Local-First** architecture where client-side storage is the Primary Source of Truth.

### State Hierarchy
1. **Global State (Zustand)**: Domain-specific data that must persist and be accessible across features (e.g., Graph Topology, Player Stats).
2. **Server State (React Query)**: Remote data cache and background synchronization.
3. **Local State (useState/useReducer)**: UI-only, transient state (e.g., Form inputs, Modal toggles).

## Core Rules of Engagement
* **Local-First Master**: IndexedDB is the Primary Source of Truth. The Server is a passive storage cache.
* **Utility Purity**: Utility functions must be **pure** (Data In → Data Out). They must never call hooks or access stores directly.
* **The Orchestrator Pattern**: Operations spanning multiple stores must be handled by **Orchestrator Hooks** to ensure atomic updates and store decoupling.
* **No Parameter Drilling**: Avoid passing `AppData` or `setData` through multiple function layers. Use the appropriate store hooks or `getState()` for non-React code.