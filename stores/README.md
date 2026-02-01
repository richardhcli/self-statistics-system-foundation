
# Global Stores

The `stores/` directory contains independent Zustand stores with **Pattern C** separation (state hook + actions hook). Each store manages a specific domain and exports dual hooks to prevent unnecessary re-renders.

## 🏗 Store Architecture

### Pattern C: State + Actions Separation
Each store exports two hooks:
- **State Hook** (`useStore`): Returns read-only state. Use when you only need data.
- **Actions Hook** (`useStoreActions`): Returns mutation functions. Use when you need to update state.

This separation prevents unnecessary re-renders—components accessing only actions don't re-render when state changes.

## 📚 Store Domains

### 1. `journal/`
**Purpose**: Manage journal entries with date-indexed hierarchy  
**Exports**: `useJournal()` + `useJournalActions()`  
**State**: `entries` (date-indexed), `tags`  
**Actions**: `addEntry()`, `updateEntry()`, `deleteEntry()`

### 2. `cdag-topology/`
**Purpose**: Manage the logical concept hierarchy (Second Brain core)  
**Exports**: `useCdagTopology()` + `useCdagTopologyActions()`  
**State**: `nodes`, `edges`, metadata  
**Actions**: `addNode()`, `addEdge()`, `updateNodeMetadata()`

### 3. `player-statistics/`
**Purpose**: Track experience and leveling progression  
**Exports**: `usePlayerStatistics()` + `usePlayerStatisticsActions()`  
**State**: `totalExp`, `currentLevel`, `nodeMastery`  
**Actions**: `awardExp()`, `updateNodeMastery()`

### 4. `user-information/`
**Purpose**: User profile and identity data  
**Exports**: `useUserInformation()` + `useUserInformationActions()`  
**State**: `username`, `userClass`, `profileVisibility`  
**Actions**: `updateName()`, `updateUserClass()`

### 5. `ai-config/`
**Purpose**: AI model and processing configuration  
**Exports**: `useAiConfig()` + `useAiConfigActions()`  
**State**: `model`, `temperature`, `voiceSettings`  
**Actions**: `updateModel()`, `updateTemperature()`, `updateVoiceSettings()`

### 6. `user-integrations/`
**Purpose**: Webhook and integration configuration  
**Exports**: `useUserIntegrations()` + `useUserIntegrationsActions()`  
**State**: `webhookConfig`, `obsidianSettings`, `integrationLogs`  
**Actions**: `updateWebhookConfig()`, `updateObsidianSettings()`

### 7. `root/`
**Purpose**: Serialization-only composition store (no state hook)  
**Exports**: `serializeRootState()`, `deserializeRootState()`  
**Use Case**: Convert all 6 stores to/from JSON for persistence

## 🔄 Data Flow

```
Component → Store Hook → Zustand State
    ↓
Action Hook → Store Mutation → use-persistence Hook
    ↓
Serialize to RootState → Save to IndexedDB
```

When an update occurs:
1. Component calls an action hook (e.g., `useJournalActions().addEntry()`)
2. Store state updates immediately (Zustand mutation)
3. `use-persistence` hook detects the change (via subscriptions)
4. `serializeRootState()` collects all 6 stores into RootState
5. JSON serialized and saved to IndexedDB
6. Components subscribed to state automatically re-render (Pattern C ensures minimal re-renders)

## 💾 Persistence

- **Format**: IndexedDB with RootState JSON serialization
- **Trigger**: Automatic on any store mutation (via `use-persistence` hook)
- **Restoration**: App startup calls `deserializeRootState()` to hydrate all stores

## 🚀 Usage Patterns

### Read-only Access
```tsx
const { entries } = useJournal();  // Only subscribe to state
```

### Mutations Only
```tsx
const { addEntry } = useJournalActions();  // Only subscribe to actions
```

### Read + Write
```tsx
const { entries } = useJournal();
const { addEntry } = useJournalActions();
```

## 🧪 Testing & Injection

Test data injection uses store-specific hook factories in `features/debug/api/test-injections.ts`:
- `createInjectTestDataHook()`: Injects complete data via `deserializeRootState()`
- `createInjectTopologyDataHook()`: Injects topology nodes/edges
- Feature-specific injectors for targeted testing
