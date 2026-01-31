# Feature: Developer Graph

The Developer Graph is an architectural editor for the `cdagTopology`.

## Capabilities
- **Manual Engineering**: Add/remove nodes and establish weighted connections (edges) via sidebars.
- **AI Neural Architect**: Describe a hierarchy in natural language to generate a structured topology fragment via Gemini.
- **Neural Generalization**: Seed a single concept (e.g., "TypeScript") to generate a complete 3-layer classification chain that automatically links to the "progression" root.

## Generalization Engine
The "Expand Logic Chain" tool uses the seed concept to:
1. Extract relevant **Actions** and **Skills**.
2. Identify the core **Characteristic** (Attribute).
3. Generate up to 10 levels of **Abstract Hierarchy** leading to the ultimate "progression" node.

## Interactive Editor
- **Property Sidebar**: Inspect and edit the ID, Label, and Weight of any selected element.
- **Static Canvas**: Uses a strictly calculated layered layout to ensure stability during structural editing.
- **Real-Time Sync**: Changes made in the Developer Graph are immediately reflected in the Concept Graph and Statistics dashboard.