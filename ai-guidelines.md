# AI Development Guidelines

**Role:** Expert React/TypeScript Developer & System Architect.  
**Goal:** Build a robust, gamified "Self-Statistics" system using a Hybrid Read-Aside architecture.

## 1. Tech Stack & Environment
*   **Framework:** React 18 (Vite) + TypeScript (Strict)
*   **State:** Zustand (Global) + IndexedDB (Persistence)
*   **Backend:** Firebase (Auth, Firestore, Storage)
*   **Styling:** Tailwind CSS + Lucide React
*   **AI:** Google Gemini 3 Flash (Primary) → Gemini 2.0 Flash (Fallback)

## 2. Core Architecture: Hybrid Read-Aside
We treat Firebase as the "Backend Source of Truth" and Zustand+IndexedDB as the "Client Source of Truth".

### Data Flow Rules
1.  **Read Strategy:** UI reads *mostly* from Zustand Store (sync). Background synchronizers fetch from Firebase and update the Store.
2.  **Write Strategy (Optimistic):**
    *   1. UI triggers Action.
    *   2. Action updates Zustand Store immediately (Optimistic UI).
    *   3. Zustand persists to IndexedDB (Middle-layer).
    *   4. Service layer pushes to Firebase (Async).
3.  **Reference Implementation:**
    *   **Pipeline Orchestration:** [src/features/journal/hooks/use-journal-entry-pipeline.ts](src/features/journal/hooks/use-journal-entry-pipeline.ts)
    *   **Persistence Middleware:** [src/stores/root/persist-middleware.ts](src/stores/root/persist-middleware.ts)

## 3. Project Structure & Organization
*   `src/features/`: Domain-specific components/hooks (Journal, Stats). **Self-contained.**
*   `src/stores/`: Zustand stores + persist config. **Data cache only.**
    *   *Reference:* [src/stores/journal/store.ts](src/stores/journal/store.ts)
*   `src/lib/`: Pure business logic, algorithms, and API wrappers. **No store imports.**
    *   *Reference:* [src/lib/soulTopology/utils/entry-pipeline/analyze-entry.ts](src/lib/soulTopology/utils/entry-pipeline/analyze-entry.ts)
*   `src/hooks/`: Cross-feature orchestration and shared utilities.
    *   *Reference:* [src/hooks/use-entry-orchestrator.ts](src/hooks/use-entry-orchestrator.ts)

## 4. AI & Automations
The system uses a deterministic "Neural Brain" to convert text → valid semantic graphs.

*   **Model Strategy:** Always use **Primary (Gemini 3)** → **Fallback (Gemini 2)** logic.
*   **Safety:** Always serialize user input with `JSON.stringify()` before prompt injection.
*   **Temperature:** Locked to `0.0` for consistency.
*   **Pipeline Logic:** [documentation/LLM-usage/ai-pipeline-strategy.md](documentation/LLM-usage/ai-pipeline-strategy.md)

## 5. Coding Standards
1.  **File Naming:** Strict kebab-case (e.g., `voice-recorder.tsx`).
2.  **Imports:** Isolate features. Use `@/lib` for bridging. Never cross-import features directly.
3.  **State Access:** Always use public hooks (`useJournalData`, `useJournalActions`). Never import store directly.
4.  **No Code Snippets in Docs:** Link to source files instead.

## 6. Documentation Maintenance
*   **Change Log:** Update `documentation/change-log/` after every meaningful session.
*   **Guidelines:** Review this file before proposing architectural changes.
*   **Features:** Keep `documentation/docs-features/` relevant to the current code state.
