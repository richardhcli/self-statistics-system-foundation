# Data Models

The application manages complex data structures that represent the user's "Neural Second Brain."

## AppData (The Unified Snapshot)
The master state object representing the entire application. This object is the primary target for full-database exports and API synchronizations.

```typescript
interface AppData {
  journal: JournalStore;
  visualGraph: VisualGraph;
  cdagTopology: CdagTopology;
  playerStatistics: PlayerStatistics;
  userInformation: UserInformation;
  integrations: IntegrationStore;
}
```

## 1. CDAG Topology (Logical Truth)
The structural "Source of Truth" for the hierarchy.
- **Node Types**: `action` (Emerald), `skill` (Amber), `characteristic` (Indigo).
- **Node Data**: 
  ```typescript
  interface CdagNodeData {
    parents: Record<string, number>; // Parent Label -> Weight (0.1 - 1.0)
    type: NodeType;
  }
  ```

## 2. JournalStore
A hierarchical storage system keyed by sortable timestamps.
- **Structure**: `Year -> Month -> Day -> Time -> EntryData`.
- **Metadata**: Each folder level (Day, Month, Year) contains a `metadata` key tracking the `totalExp` gained in that specific period.

## 3. Player Statistics (Progression)
Tracks growth across every node identified in the hierarchy.
- **Experience**: Floating point accumulated effort.
- **Level**: Calculated dynamically: `floor(experience / 10) + 1`.

## 4. Visual Graph (UI State)
View-state metadata for the D3 renderer.
- **Nodes**: Stores `id`, `label`, `level` (depth), and simulated `x`/`y` coordinates.
- **Edges**: Stores `id`, `source`, `target`, and `proportion` (weight).

## 5. User Information
Identity and profile settings including `name`, `userClass`, and `mostRecentAction`.