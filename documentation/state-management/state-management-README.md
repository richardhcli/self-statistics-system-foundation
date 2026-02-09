# State Management General Style Guide

**Purpose**: High-level overview of state management patterns and principles  
**Audience**: Developers new to the project  
**Related Documents**:
  - [GLOBAL_STATE.md](./GLOBAL_STATE.md) — Immutable store pattern reference
  - [ORCHESTRATOR_PATTERN.md](./ORCHESTRATOR_PATTERN.md) — Cross-store coordination
  - [LOCAL_STATE.md](./LOCAL_STATE.md) — Component-level state
  - [ai-guidelines.md](../ai-guidelines.md) — AI-focused quick reference

This file establishes the "Rules of Engagement" for the overall state architecture.

---

## Architecture Overview
This project follows a **Hybrid Read-Aside** architecture where Firebase is the source of truth and client-side storage is a persistent cache.

### State Hierarchy
1. **Global State (Zustand)**: Domain-specific data that must persist and be accessible across features (e.g., Graph Topology, Player Stats).
2. **Server State (React Query)**: Remote data cache and background synchronization (not yet implemented; reserved for future).
3. **Local State (useState/useReducer)**: UI-only, transient state (e.g., Form inputs, Modal toggles).

---

## Core Rules of Engagement

* **Read-Aside Master**: Firebase is the source of truth for cloud-backed data. IndexedDB is a persistent cache for fast boots and offline reads.
* **Utility Purity**: Utility functions must be **pure** (Data In → Data Out). They must never call hooks or access stores directly.
* **The Orchestrator Pattern**: Operations spanning multiple stores must be handled by **Orchestrator Hooks** to ensure atomic updates and store decoupling. See [ORCHESTRATOR_PATTERN.md](./ORCHESTRATOR_PATTERN.md) for detailed guidelines.
* **Type Safety**: Always use the modern `GraphState` format; legacy format support has been removed.
* **No Parameter Drilling**: Avoid passing data through multiple function layers. Use the appropriate store hooks or `getState()` for non-React code.

---

## Quick Decision Tree

**Do I need state?**

→ Is it used by multiple distant features **and** survives page refresh?  
&nbsp;&nbsp;&nbsp;&nbsp;**YES** → Use Zustand store (see [GLOBAL_STATE.md](./GLOBAL_STATE.md))  
&nbsp;&nbsp;&nbsp;&nbsp;**NO** → Is it used by adjacent components in the same feature?  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**YES** → Use local `useState` lifted to common parent  
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;**NO** → Use component-level `useState`

---

## Further Reading

- [GLOBAL_STATE.md](./GLOBAL_STATE.md) — When implementing new stores
- [ORCHESTRATOR_PATTERN.md](./ORCHESTRATOR_PATTERN.md) — When coordinating multi-store logic
- [LOCAL_STATE.md](./LOCAL_STATE.md) — For component-level state guidelines