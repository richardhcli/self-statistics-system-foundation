# Feature: Concept Graph

The Concept Graph provides a stable, layered representation of the user's life hierarchy.

## Visual vs. Logical Separation
- **Logical State**: Structure, weights, and types are defined in `cdagTopology`.
- **Visual State**: Coordinates and simulation metadata are stored in `visualGraph`.
- **Synchronization**: `syncGraphFromTopology` automatically rebuilds the visual map whenever the logical hierarchy grows.

## Interactivity
- **Multi-Node Selection**: Click to toggle or drag to select.
- **Relationship Glow**: A tiered highlighting system traces the flow of concepts through indigo glows and strokes.
- **Stable Reordering**: Vertical drag-and-drop within a rank column using a "Swap" mechanic.