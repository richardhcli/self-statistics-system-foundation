# Potential next steps for this app


### temporary bypass:


### full delete: 
Go back to recent "firebase migration plans" documents.

Using documentation\docs-features\features-datastores-debug.md
improve the "neural wipe" delete. Rename this to "destroy all data" in the debugging menu. Split this button into its own panel aside from the Batch Injection component: 

Create (Button color) Button:functionlity pairs: 
(Dark red) Delete Account: removes account from firebase, and destroys all data. 
(Dark Red) Destroy All Data: deletes all firebase collections, but keeps user document and google sign-in information. Clears current global stores and removes all data in IndexDB. 
(red) Remove firebase data: removes all firebase collections, but keeps user document and google sign-in information. 
(red) Clear indexDB: remove all indexDB data. 
(red) Clear global stores: removes all global stores data. 

### finalize migration: 
documentation\change-log\2026-02-07-STORAGE_ARCHITECTURE_BLUEPRINT.md


### profile picture: 
update default picture in statistics -> information header to be profile pic. update debug view to show profile pic in component. 

### 1. Cycle Prevention (App Logic)

Firestore does not enforce DAG constraints. You **must** verify that `targetId` is not an ancestor of `sourceId` in your React logic before calling `upsertEdge`.

### 2. Required Indexes

To filter edges by source, target, or metadata, you must define indexes in `firestore.indexes.json`:

* `edges`: `source` (Asc) + `weight` (Desc)
* `edges`: `target` (Asc) + `metadata.type` (Asc)
