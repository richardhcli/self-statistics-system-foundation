# Changelog: Neural Second Brain Evolution

This document tracks the iterative development of the Journal & Graph AI application.

## [v1.6.0] - Complete overhaul of backend
- jornal, graph, and user settings all stored in backend
- firebase backend used as main source of truth. 
- indexDB caching for read-aside architecture. 

## [v1.5.0] - The Modular Journal Refactor
- **Self-Contained Journal Feature**: Completely refactored the journal feature to be a fully modular, self-contained React component.
- **Simplified State Management**: Replaced Zustand local store with simple React useState for component-scoped UI state (dropdowns, forms, processing).
- **Improved Data Flow**: Journal entries now update the store **immediately** with loading placeholders before AI processing, ensuring responsive UI.
- **Cleaner App Integration**: Simplified `app.tsx` to use the new `<JournalFeature />` component with a clean integration callback interface.
- **Enhanced Documentation**: Updated `features-journal.md` with comprehensive architectural documentation, data flow diagrams, and usage examples.
- **Type Safety**: Fixed type inconsistencies in journal entry utilities with proper month normalization.

## [v1.4.0] - The Visualization Refinement
- **Perfected Concept Graph**: Implemented a stable Directed Acyclic Graph (DAG) layout using a layered ranking algorithm.
- **Ultra-Rigid Snapping**: Developed a custom D3 force tick handler that forcibly aligns nodes to their target grid coordinates, eliminating jitter and elastic bounce.
- **Rank Swapping**: Added vertical drag-and-drop reordering within topological columns.
- **Multi-Node Selection**: Introduced a Set-based selection state with relationship highlighting (glow effects for ancestors/descendants).
- **Style Fixes**: Resolved D3 namespace and type errors across the `visual-graph` and `developer-graph` modules.

## [v1.3.0] - The Bulletproof Refactor
- **Architecture Migration**: Full migration to the **Bulletproof React** project structure (Features, Lib, Stores, Hooks, Components).
- **Standardized Naming**: Converted all files to `kebab-case` and centralized module exports through `index.ts` barrels.
- **Discord-Style Settings**: Implemented a two-column persistent settings interface with sub-views for Status, Profile, AI Features, and Privacy.
- **AI Config Panel**: Added UI for model selection (Flash vs Pro) and temperature tuning.
- **Data Wipe Safety**: Added a "Type 'DELETE' to confirm" modal for catastrophic factory resets.

## [v1.2.0] - Gamification & Propagation
- **EXP Engine**: Developed the "Path-Weighted Cumulative Averaging" algorithm for upward experience propagation.
- **Player Statistics**: Created a character sheet system tracking levels, cumulative growth, and domain power levels.
- **Hierarchical Metadata**: Refactored the Journal Store to store EXP snapshots at the Day, Month, and Year levels.
- **Delta Tracking**: Added "EXP Gained Today" and "EXP Gained Yesterday" comparisons to the Stats Header.

## [v1.1.0] - AI & Connectivity
- **3-Layer Classification**: Developed the Gemini pipeline to extract Actions -> Skills -> Characteristics from unstructured input.
- **Voice Ingestion**: Integrated browser Microphone API with a real-time canvas-based oscilloscope and transcription service.
- **Outbound Webhooks**: Added a real-time JSON broadcast system with diagnostic transmission logs.
- **Obsidian Sync**: Implemented Local REST API integration to write Markdown notes directly to the user's local vault.

## [v1.0.0] - Foundations
- **Local-First Persistence**: Initialized IndexedDB layer for browser-based data storage.
- **Unified State**: Established the `AppData` master snapshot model.
- **Data Portability**: Implemented JSON Import/Export for full database backups.
- **Debug Tools**: Built the Batch Injection panel for automated testing with AI and Manual datasets.
