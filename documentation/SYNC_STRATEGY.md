# Graph Store Sync Strategy

**Version**: 1.0  
**Effective Date**: February 1, 2026  
**Phase**: Manual Sync (Phase 1)

## Overview

The cdag-topology store implements a **local-first, manual sync** strategy where users explicitly save graph changes to the server. This design prioritizes data correctness and offline resilience over real-time synchronization.

## Sync Model: Local-First with Manual Trigger

```
User Makes Changes (local store)
    ↓
Changes Queued in Local Store + IndexedDB
    ↓
User Clicks "Save Graph" Button
    ↓
Manual Sync Triggered
    ↓ (Online)           ↓ (Offline)
POST /api/graph    Queue in Memory
    ↓                    ↓
Server Updated     Retry on Reconnect
    ↓
Sync Complete (toast notification)
```

## Sync Mechanics

### 1. Conflict Resolution: Last-Write-Wins

**Rule**: Client state overwrites server state on save.

**Rationale**:
- Users have full visibility of their changes before saving
- No automatic/silent overwrites
- User has final say on what persists

**Implementation**:
```typescript
// Client sends entire GraphState
POST /api/graph
{
  nodes: Record<string, NodeData>,
  edges: Record<string, EdgeData>,
  version: number,
  timestamp: ISO8601  // For audit trail
}

// Server stores as-is (replaces previous version)
// Returns: { success: boolean, serverTimestamp: ISO8601 }
```

### 2. Error Handling: Offline-First Queue

**Strategy**: If sync fails, queue changes locally and retry when connection restored.

**Queue Implementation**:
```typescript
// stores/cdag-topology/sync-queue.ts
interface QueuedSync {
  id: string;              // UUID
  graphState: GraphState;  // Full state snapshot
  timestamp: number;       // When queued
  retries: number;         // Retry count
  lastError?: string;      // Last error message
}

// IndexedDB table: "sync-queue"
// Persists across app restarts
```

**Retry Strategy**:
- **Initial**: Immediate retry on connection restore
- **Exponential Backoff**: 1s → 2s → 4s → 8s → 16s (max)
- **Max Retries**: 10 attempts before manual intervention
- **Persistence**: Queued items survive app restart

### 3. Manual Save Button

**UI Placement**: Graph editor top-right or in settings sidebar

**Button States**:
- **Idle**: "Save Graph" (clickable)
- **Saving**: "Saving..." (disabled, spinner)
- **Error**: "Save Failed - Retry?" (clickable with error icon)
- **Success**: "Saved" (brief notification, auto-dismiss after 3s)

**User Feedback**:
```typescript
// Toast notifications
"Graph saved successfully" ✓ (green, 3s auto-dismiss)
"Failed to save graph - queued for later" ⚠️ (yellow, persistent)
"Graph sync failed after 10 retries. Please contact support." ✗ (red, persistent)
```

## API Contract

### POST /api/graph
**Purpose**: Save entire graph state to server

**Request**:
```typescript
{
  nodes: Record<string, {
    id: string;
    label: string;
    type: 'action' | 'skill' | 'characteristic' | 'none';
    metadata?: Record<string, any>;
  }>;
  edges: Record<string, {
    id: string;
    source: string;
    target: string;
    weight?: number;
    label?: string;
  }>;
  version: number;  // Schema version
}
```

**Response Success (200)**:
```typescript
{
  success: true;
  serverTimestamp: "2026-02-01T14:30:45.123Z";
}
```

**Response Error (4xx/5xx)**:
- **400**: Invalid schema → Don't retry, alert user
- **401**: Unauthorized → Clear token, redirect to login
- **409**: Conflict (server has newer data) → User chooses: keep local or fetch latest
- **500+**: Server error → Queue for retry
- **Network Error**: Timeout → Queue for retry

## Offline Support

### Works Offline
- ✅ Add nodes
- ✅ Remove nodes
- ✅ Add edges
- ✅ Modify edge weights
- ✅ Read/browse graph

### Blocked Offline
- ❌ Save to server (queued automatically)
- ❌ Fetch latest from server (shown as stale data)

**Offline Indicator**:
- Status bar shows "Offline - Changes will sync when online"
- Save button shows cached indicator

### Auto-Retry on Online

When device comes online:
1. Check IndexedDB sync queue
2. Attempt to POST queued state
3. On success: Clear queue, show "Synced" notification
4. On failure: Keep in queue, show "Sync failed - will retry"

## Data Consistency

### No Optimistic Updates
- Changes are **local immediately** (in IndexedDB)
- Server sees changes **only after explicit save**
- No "rollback on server rejection"

### Single Source of Truth
1. **IndexedDB**: Local master during offline
2. **Server**: Master when online
3. **Zustand**: In-memory cache (ephemeral)

### Atomicity
- Entire GraphState is saved/synced as atomic unit
- No partial edge/node syncs

## Future Phases

### Phase 2: Debounced Auto-Save
- Batch changes every 5 seconds
- Still manual trigger for critical operations
- Approximate ETA: After Phase 1 stabilization

### Phase 3: Real-Time Optimistic Sync
- WebSocket connection for live updates
- Server pushes conflicts to client
- 3-way merge for simultaneous edits
- ETA: Q2 2026

### Phase 4: Collaborative Multi-User
- Last-write-wins → Vector clock / CRDT
- Presence indicators (who's editing?)
- Live cursor tracking
- ETA: Q3 2026

## Implementation Checklist

### Phase 1 Deliverables
- [ ] `sync-middleware.ts`: Queue management, retry logic
- [ ] `syncGraphState()`: POST to /api/graph with error handling
- [ ] `useGraphSyncStatus()`: Selector for UI (idle | saving | error)
- [ ] Save button in developer-graph UI
- [ ] Toast notifications for sync status
- [ ] IndexedDB "sync-queue" table
- [ ] Auto-retry on online detection
- [ ] Offline indicator in UI

### Testing
- [ ] Unit: Retry logic, queue persistence
- [ ] Integration: Save → queue → retry → success
- [ ] E2E: Offline → go online → auto-sync
- [ ] Error cases: 4xx, 5xx, network timeout
- [ ] Conflict: Server has newer data (409 handling)

## Configuration

```typescript
// stores/cdag-topology/sync-config.ts
export const SYNC_CONFIG = {
  // Retry strategy
  MAX_RETRIES: 10,
  INITIAL_RETRY_DELAY_MS: 1000,
  BACKOFF_MULTIPLIER: 2,
  MAX_RETRY_DELAY_MS: 16000,
  
  // UI feedback
  TOAST_AUTO_DISMISS_MS: 3000,
  ERROR_TOAST_PERSISTENT: true,
  
  // Network detection
  ONLINE_CHECK_INTERVAL_MS: 5000,
  
  // API endpoint
  GRAPH_SYNC_ENDPOINT: '/api/graph',
  TIMEOUT_MS: 30000,
};
```

## Security Considerations

### Authentication
- Use current auth token from store
- Include in Authorization header
- Refresh token if 401 received

### Validation
- Server validates schema on receive
- Client validates before sending
- Never trust user-provided version numbers

### Data Privacy
- Graph state includes node labels (potentially PII)
- Use HTTPS for all sync operations
- Consider encryption at rest in IndexedDB

## Monitoring & Debugging

### Logging
```typescript
// Log all sync attempts for debugging
logger.info('Sync triggered', { nodeCount, edgeCount });
logger.info('Sync success', { serverTimestamp });
logger.error('Sync failed', { error, retryCount });
logger.info('Sync queued for retry', { queueSize });
```

### Metrics to Track
- Sync success rate %
- Average sync time ms
- Queue size (max reached)
- Retry attempts (histogram)
- Offline time duration

## References

- [STATE_MANAGEMENT_V2.md](./STATE_MANAGEMENT_V2.md#local-first-graph-store-architecture) - Store architecture
- [GRAPH_STORE_MIGRATION_NOTES.md](./GRAPH_STORE_MIGRATION_NOTES.md) - Implementation decisions
- IndexedDB table schema: `cdag-topology` store definition
