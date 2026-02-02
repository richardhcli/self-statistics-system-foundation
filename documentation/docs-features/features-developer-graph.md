# Feature: Developer Graph

The Developer Graph is a straightforward architectural editor for the global graph store (`cdag-topology`). It focuses on two core responsibilities:

1. **Display**: Render the graph using a layered DAG layout visualization
2. **Write**: CRUD operations for nodes and edges through an intuitive sidebar editor

## Core Responsibilities

### Display (Read-Only)
- Converts global store data (NodeData/EdgeData records) into visual format
- Applies layered DAG layout algorithm for hierarchical visualization
- Renders nodes and edges using D3.js with SVG
- Handles user selection (click to select nodes/edges)

### Write (CRUD)
- **Create**: Add new nodes with labels and parent relationships
- **Read**: Display selected node/edge properties in property sidebar
- **Update**: Edit labels, weights, and metadata of selected elements
- **Delete**: Remove nodes and edges from the topology

## User Interface

### Layout
```
┌────────────────────────────────────────────┐
│           Developer Graph Header           │
├──────────┬──────────────────────┬──────────┤
│  Editor  │                      │ Property │
│ Sidebar  │    DAG Canvas        │ Sidebar  │
│ (CRUD)   │    (Display)         │ (Edit)   │
│          │                      │          │
│ - Add    │   [Nodes Visible]    │ - Show   │
│ - Remove │    with Layout       │ - Edit   │
│ - Update │                      │ - Close  │
│          │                      │          │
└──────────┴──────────────────────┴──────────┘
```

### Editor Sidebar (Left)
- **Add Node**: Form to create new nodes with parent selection
- **Remove Node**: Dropdown to select and remove existing nodes
- **Add Edge**: Create connections between nodes with optional weight
- **Remove Edge**: Dropdown to select and remove edges

### DAG Canvas (Center)
- Visual representation of graph structure
- Nodes positioned by hierarchical layout algorithm
- Edges shown as connections between nodes
- Click to select nodes/edges for editing

### Property Sidebar (Right)
- Appears when a node or edge is selected
- Display and edit properties:
  - **Nodes**: ID, Label, Type
  - **Edges**: Source, Target, Weight, Label
- Close button to deselect

## Data Flow

### Reading (Display)
```
Global Store (cdag-topology)
    ↓ useGraphNodes() / useGraphEdges()
Atomic Selectors
    ↓
Convert to GraphNode[] / GraphEdge[]
    ↓
calculateLayout() → computes positions
    ↓
DAGCanvas renders
```

### Writing (CRUD)
```
Editor Sidebar Input
    ↓
handleAdd/Update/Remove handlers
    ↓
useGraphActions() (atomic actions)
    ↓
Global Store Mutation
    ↓
useGraphNodes/useGraphEdges recompute
    ↓
Auto-update Display via React
```

## Integration with Global Store

All changes made in Developer Graph are **immediately written** to the global `cdag-topology` store:
- No separate sync layer required
- Optimistic updates (changes appear instantly)
- Graph data persists to IndexedDB through store middleware
- Changes visible in other features (Statistics, Journal, etc.) automatically

## Technical Details

- **Store Integration**: Direct mutation through `useGraphActions()` atomic actions
- **Selection State**: Local React state (not persisted)
- **Layout Algorithm**: Sugiyama hierarchical DAG layout via `calculateLayout()`
- **Rendering**: D3.js with SVG elements
- **Data Format**: Flat normalized schema (NodeData/EdgeData records)