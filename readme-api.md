# API Specification & Sync Strategy

The system is designed with a **Local-First** philosophy. IndexedDB is the primary store, and the API layer serves as a synchronization bridge for fullstack integration.

## Centralized Sync strategy
To ensure data integrity of the weighted graph and propagation logic, the application uses **Batch Synchronization**. The `stores/user-data` store acts as the single interaction point for full-state updates.

| Endpoint | Method | Description | Payload |
| :--- | :--- | :--- | :--- |
| `/sync/full` | `GET` | Retrieve the entire AppData state snapshot. | `AppData` |
| `/sync/full` | `POST` | Persist a complete state snapshot (Journal, Graph, Stats). | `AppData` |

## Feature-Specific Endpoints (Boilerplate)
While batch sync is preferred for stability, individual features maintain specialized endpoints for fine-grained updates if needed.

- **Journal**: `GET/POST /journal`
- **Topology**: `GET/POST /cdag-topology`
- **Statistics**: `GET/POST /player-statistics`
- **Identity**: `GET/POST /user-information`

## Implementation Guide
- **Library**: All requests must use the `apiClient` in `lib/api-client.ts`.
- **Trigger**: Sync can be triggered manually in Settings or automatically on every state change detected by `use-persistence`.
- **Safety**: Always perform a deep-clone of state before transmitting to avoid race conditions with the IndexedDB transaction.