# Technology Stack

**Last Updated**: February 10, 2026

The Neural Second Brain is built on a modern, high-performance stack designed for hybrid read-aside reliability and semantic intelligence.

## Core Frameworks
- **React 19** (`^19.2.3`): Leverages the latest concurrent rendering features and `useTransition` for smooth UI updates during heavy AI processing.
- **TypeScript** (`~5.8.2`): Strict mode for comprehensive type safety.
- **Vite 6** (`^6.2.0`): Fast build tooling with HMR. Custom path aliases: `@/` → `src/`, `@systems/` → `src/systems/`.
- **Tailwind CSS 4** (`^4.1.18`): Utility-first styling for a high-contrast, professional-grade interface with native Dark Mode support.

## State Management
- **Zustand 5** (`^5.0.11`): Global state with the Separated Selector Facade Pattern. Independent stores with `idb-keyval` persistence.
- **IndexedDB** (via `idb-keyval` `^6.2.2`): Persistent cache layer for fast boot and offline access.

## Backend
- **Firebase** (`^12.8.0`): Authentication (Google + Anonymous), Firestore (cloud source of truth), and Analytics.
- **Hybrid Read-Aside Architecture**: Firebase writes are the source of truth; Zustand + IndexedDB provide cache-first reads.

## Semantic Intelligence
- **Google Gemini API** (via `@google/genai` `^1.34.0`): Utilizes `gemini-3-flash-preview` (primary) and `gemini-2.0-flash` (fallback) for:
  - Speech-to-text transcription.
  - Multi-step semantic classification (Actions → Skills → Characteristics).
  - Neural generalization of concepts with deep abstraction chains.
- **Cognitive Temperature**: Locked to `0.0` for deterministic, reproducible classification.

## Data & Visualization
- **D3.js v7** (`^7.9.0`): Powers both the Concept Graph and the Developer Graph. Used for stable DAG layouts, force simulations, and interactive SVG rendering.
- **Recharts** (`^3.7.0`): Statistical charting library for the RPG radar chart and data visualizations.
- **Lucide React** (`^0.562.0`): Comprehensive, consistent iconography set for high-density dashboards.

## Routing & Error Handling
- **React Router DOM** (`^7.13.0`): URL-driven routing with protected route guards.
- **React Error Boundary** (`^6.1.0`): Graceful error recovery for UI components.
- **nanoid** (`^5.1.6`): Compact, URL-safe unique ID generation.

## Architecture Patterns
- **Bulletproof React**: A scalable architecture emphasizing feature-based modularity.
- **Hybrid Read-Aside, Sync-Behind**: Firebase is the source of truth, while Zustand + IndexedDB provide cache-first reads with optimistic writes.
- **Semantic Layering**: A hierarchical approach to data modeling that maps granular human tasks to abstract cognitive traits.
- **Systems Architecture**: Pure domain logic (game math, progression rules) isolated in `src/systems/` — no React, no stores, no side-effects.
- **Separated Selector Facade (Pattern C)**: All global stores expose state via fine-grained selector hooks and a single stable actions object.
- **Orchestrator Pattern**: Cross-store business logic coordinated via custom hooks in `src/hooks/`.
