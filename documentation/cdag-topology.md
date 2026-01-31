
# cdagTopology: The Neural Source of Truth

The `cdagTopology` is the logical structural backbone of the application.

## 🧠 Core Architecture

The topology is a **Weighted Directed Acyclic Graph (DAG)** where every node belongs to a specific functional category.

### Data Structure
```typescript
type NodeType = 'action' | 'skill' | 'characteristic' | 'none';

interface CdagNodeData {
  parents: Record<string, number>; // Parent Label -> Weight
  type: NodeType;                 // Classification for coloring and logic
}

type CdagTopology = Record<string, CdagNodeData>;
```

## 🏷 Classification Logic
- **Actions**: Real-world activities. They are the sources of EXP.
- **Skills**: Middle-management nodes. They aggregate experience from multiple actions.
- **Characteristics**: Top-level roots. They represent the abstract nature of the user's effort.

## 🤖 Adaptive Learning
Edge weights are adjusted via the `mergeTopology` logic using a global `LEARNING_RATE`.
1. **Fragments**: AI generates small hierarchy fragments from entries.
2. **Convergence**: Fragments merge into the main topology. If an edge already exists, its weight shifts slightly toward the new predicted value, allowing the brain to learn user patterns over months of use.

## 📈 Integration
- **D3 Layout**: Uses `NodeType` to determine horizontal ranking and coloring.
- **EXP Engine**: Uses the weighted hierarchy to calculate back-propagation intensities.
