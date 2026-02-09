# Potential next steps for this app




### 1. Cycle Prevention (App Logic)

Firestore does not enforce DAG constraints. You **must** verify that `targetId` is not an ancestor of `sourceId` in your React logic before calling `upsertEdge`.

### 2. Required Indexes

To filter edges by source, target, or metadata, you must define indexes in `firestore.indexes.json`:

* `edges`: `source` (Asc) + `weight` (Desc)
* `edges`: `target` (Asc) + `metadata.type` (Asc)
