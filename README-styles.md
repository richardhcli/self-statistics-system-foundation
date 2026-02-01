# Journal & Graph AI - Style & Architecture

This project strictly adheres to the [Bulletproof React](https://github.com/alan2207/bulletproof-react) architecture, prioritizing modularity, scalability, and clear separation of concerns.

## Project Structure

- `app/`: Global entry-point logic and centralized providers (`provider.tsx`, `app.tsx`).
- `features/`: Modularized business logic. Each feature is a self-contained domain.
  - `[feature]/api/`: Endpoint definitions and data fetching logic.
  - `[feature]/components/`: Feature-specific UI elements (kebab-case).
  - `[feature]/types/`: Domain-specific TypeScript definitions.
  - `[feature]/utils/`: Domain-specific helper functions.
  - `index.ts`: The public barrel file for the module.
- `stores/`: Global business logic that spans multiple features (e.g., Topology, UserData, PlayerStatistics). Store logic is minimized to declarations and API wrappers.
- `lib/`: Standardized third-party abstractions and core infrastructure.
  - `api-client.ts`: Unified fetch wrapper for REST operations.
  - `google-ai/`: Gemini SDK integration and classification prompts.
  - `db.ts`: IndexedDB persistence logic.
  - `soulTopology/`: Brain structure utilities (topology merge, propagation, AI generalization).
- `hooks/`: Global cross-cutting concerns (e.g., `use-persistence.ts`, `use-app-data.ts`).
- `components/layout/`: Shared structural components like `header.tsx` and `main-layout.tsx`.

## Persistence & Sync Strategy

The application follows a **Local-First** philosophy.
1. **Source of Truth**: The React state acts as the runtime source of truth.
2. **Persistence**: The `use-persistence` hook automatically commits the `AppData` state to IndexedDB on every change.
3. **Synchronization**: Remote synchronization is a secondary bridge. To ensure data integrity across the weighted graph, the app uses **Centralized Batch Sync** via the `stores/user-data` API.

### Core Endpoints:
- `/sync/full`: Primary endpoint for pushing/pulling the entire `AppData` snapshot.
- `/journal`: Secondary endpoint for historical record management.
- `/cdag-topology`: Secondary endpoint for hierarchy management.
- `/player-statistics`: Secondary endpoint for experience and leveling data.

## Coding Conventions
- **File Naming**: Strict **kebab-case** for all files and folders (e.g., `voice-recorder.tsx`).
- **Component Naming**: PascalCase for React components inside the file.
- **Exports**: Use index-barrel files (`index.ts`) for clean, feature-level imports.
- **Logic**: Prefer custom hooks and utility functions over complex component-level logic.
- **Styles**: Utility-first CSS using Tailwind CSS for all components.
