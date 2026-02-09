# Technology Stack

The Neural Second Brain is built on a modern, high-performance stack designed for hybrid read-aside reliability and semantic intelligence.

## Core Frameworks
- **React 19**: Leverages the latest concurrent rendering features and `useTransition` for smooth UI updates during heavy AI processing.
- **Tailwind CSS**: Utility-first styling for a high-contrast, professional-grade interface with native Dark Mode support.

## Semantic Intelligence
- **Google Gemini API**: Utilizes the `gemini-3-flash-preview` and `gemini-3-pro-preview` models for:
  - Speech-to-text transcription.
  - Multi-step semantic classification.
  - Neural generalization of concepts.

## Data & Visualization
- **D3.js (v7)**: Powers both the Concept Graph and the Developer Graph. Used for stable DAG layouts, force simulations, and interactive SVG rendering.
- **IndexedDB**: Persistent cache layer. Enables fast boot and offline access while Firebase remains the source of truth.
- **Lucide React**: A comprehensive, consistent iconography set for high-density dashboards.

## Architecture Patterns
- **Bulletproof React**: A scalable architecture emphasizing feature-based modularity.
- **Hybrid Read-Aside**: Firebase is the source of truth, while Zustand + IndexedDB provide cache-first reads with background synchronization.
- **Semantic Layering**: A hierarchical approach to data modeling that maps granular human tasks to abstract cognitive traits.
