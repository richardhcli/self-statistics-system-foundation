# Journal & Graph AI: The Neural Second Brain

Journal & Graph AI is a high-fidelity personal growth platform that transforms unstructured thoughts and voice recordings into a structured, hierarchical knowledge base. It leverages the **Google Gemini API** to classify human effort and visualizes progress through a stable **Directed Acyclic Graph (DAG)**.

Project URL: https://self-statistics-system-v1.web.app

## 🚀 Core Philosophy & Mechanics

### 1. The 3-Layer Semantic Pipeline
The application organizes knowledge into three distinct functional layers, styled as a real-life RPG status system:
- **Actions (Emerald #10b981)**: Granular activities extracted from journal entries (e.g., "Debugging", "Squats").
- **Skills (Amber #f59e0b)**: Intermediate competencies that encapsulate groups of actions (e.g., "Frontend Engineering").
- **Characteristics (Indigo #4f46e5)**: High-level human traits representing fundamental potential (e.g., "Intellect", "Vitality").

### 2. Adaptive Neural Weighting
The "Brain" is dynamic. Gemini suggests weights for relationships; the system uses a **Learning Rate (0.01)** to adjust existing edge weights over time, allowing the hierarchy to adapt to your evolving habits.

### 3. Cumulative EXP Propagation
Effort is quantified as EXP and propagated using **Path-Weighted Cumulative Averaging**:
- EXP flows upward from Actions to Characteristics.
- Normalization prevents "Domain Inflation," ensuring root attributes reflect average intensity across sub-trees.

---

## 🛠 Application Views

### 📔 Journal
A hierarchical feed (Year > Month > Day) for voice and text ingestion. Features detailed "Neural Impact Analysis" for every entry, showing exactly where your effort went. Includes a **Canvas-based Oscilloscope** for real-time voice feedback.

### 🕸 Concept Graph (Visual Source of Truth)
A stable, interactive DAG visualization designed for semantic clarity and structural persistence. Supports multi-node selection, relationship path highlighting, and **Ultra-Rigid position snapping** for a deterministic UX.

### 📊 Statistics
A character sheet displaying global levels, total EXP, and a "Power Grid" of core attributes. Tracks daily and yesterday's EXP deltas via hierarchical metadata.

### ⚙️ Settings & Integrations
A persistent Discord-style interface for managing profile metadata and external connections:
- **AI Configuration**: Fine-tune classification temperature, model selection, and transcription feedback.
- **Data Portability**: Full JSON Backup & Restore of the IndexedDB state.
- **Webhooks**: Real-time JSON broadcasts of processed entries.
- **Obsidian**: Local REST API integration to sync entries as Markdown notes.

### 🛠 Debug Console
Low-level access to the application engine. Features batch data injection (AI, Manual, Complex, and Brain datasets), an experience injector for math verification, and a raw data browser for IndexedDB inspection.

---

## 🏗 Technical Stack & Architecture
- **Framework**: React 19 (Bulletproof Architecture).
- **AI Engine**: Google Gemini (`gemini-3-flash-preview`).
- **Visuals**: D3.js with stable hierarchical layouts and rigid snapping.
- **Persistence**: Local-First IndexedDB.
- **Connectivity**: PWA-ready with Service Worker and Manifest support.
- **Brain Logic**: Topology and propagation utilities live in `lib/soulTopology`.

For deep-dives into the implementation, see the `/documentation` directory.
