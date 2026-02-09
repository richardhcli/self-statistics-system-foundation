import React, { useState } from "react";
import { useAuth } from "@/providers/auth-provider";
import { deserializeRootState, serializeRootState } from "@/stores/root";
import {
  buildRootStateFromSnapshot,
  fetchBackendDatastoreSnapshot,
  type BackendDatastoreSnapshot,
} from "../utils/datastore-sync";
import type { FirestoreDeleteTarget } from "../utils/json-container-renderer";
import {
  deleteFirestoreCollection,
  deleteFirestoreDocument,
  deleteFirestoreField,
  removeFirestoreArrayValue,
} from "@/lib/firebase/firestore-crud";
import type { DatastoreConsoleStatus } from "./datastores-console";
import ForceSyncActions from "./force-sync/force-sync-actions";
import ForceSyncSnapshot from "./force-sync/force-sync-snapshot";

interface ForceSyncPanelProps {
  onLog: (message: string, status?: DatastoreConsoleStatus) => void;
}

const formatTimestamp = () => new Date().toLocaleTimeString();

/**
 * ForceSyncPanel
 *
 * Orchestrates backend fetch, store hydration, and IndexedDB persistence.
 */
const ForceSyncPanel: React.FC<ForceSyncPanelProps> = ({ onLog }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [snapshot, setSnapshot] = useState<BackendDatastoreSnapshot | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);
  const [lastStoreSyncAt, setLastStoreSyncAt] = useState<string | null>(null);
  const [lastIndexDbSyncAt, setLastIndexDbSyncAt] = useState<string | null>(null);

  const log = (message: string, status: DatastoreConsoleStatus = "info") => {
    onLog(message, status);
  };

  const fetchSnapshot = async () => {
    if (!uid) {
      log("No authenticated user available for fetch.", "error");
      return null;
    }

    setIsFetching(true);
    try {
      const nextSnapshot = await fetchBackendDatastoreSnapshot(uid);
      setSnapshot(nextSnapshot);
      const timestamp = formatTimestamp();
      setLastFetchedAt(timestamp);
      log(`Backend fetch complete at ${timestamp}.`, "success");
      return nextSnapshot;
    } catch (error) {
      log("Backend fetch failed. Check console for details.", "error");
      console.error("[ForceSync] Backend fetch failed", error);
      return null;
    } finally {
      setIsFetching(false);
    }
  };

  const applySnapshotToStores = async (data: BackendDatastoreSnapshot | null) => {
    if (!data) {
      log("No backend snapshot available to apply.", "warning");
      return;
    }

    setIsApplying(true);
    try {
      const nextState = buildRootStateFromSnapshot(data, serializeRootState());
      deserializeRootState(nextState);
      const timestamp = formatTimestamp();
      setLastStoreSyncAt(timestamp);
      log(`Stores hydrated at ${timestamp}.`, "success");
    } catch (error) {
      log("Store hydration failed. Check console for details.", "error");
      console.error("[ForceSync] Store hydration failed", error);
    } finally {
      setIsApplying(false);
    }
  };

  const syncStoresToIndexedDb = async () => {
    setIsSyncing(true);
    try {
      // Re-apply current RootState to trigger persist middleware after hydration.
      deserializeRootState(serializeRootState());
      const timestamp = formatTimestamp();
      setLastIndexDbSyncAt(timestamp);
      log(`IndexedDB sync complete at ${timestamp}.`, "success");
    } catch (error) {
      log("IndexedDB sync failed. Check console for details.", "error");
      console.error("[ForceSync] IndexedDB sync failed", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceSync = async () => {
    const fetched = await fetchSnapshot();
    await applySnapshotToStores(fetched);
    await syncStoresToIndexedDb();
  };

  const handleDelete = async (target: FirestoreDeleteTarget) => {
    if (!uid) {
      log("No authenticated user available for delete.", "error");
      return;
    }

    try {
      switch (target.type) {
        case "collection":
          await deleteFirestoreCollection(target.path);
          break;
        case "doc":
          await deleteFirestoreDocument(target.path);
          break;
        case "field":
          await deleteFirestoreField(target.path, target.fieldPath);
          break;
        case "array-value":
          await removeFirestoreArrayValue(target.path, target.fieldPath, target.value);
          break;
        default:
          break;
      }

      log(`Delete completed for ${target.path}.`, "success");
      await fetchSnapshot();
    } catch (error) {
      log("Delete failed. Check console for details.", "error");
      console.error("[ForceSync] Delete failed", error);
    }
  };

  const busy = isFetching || isApplying || isSyncing;

  return (
    <div className="space-y-6">
      <ForceSyncActions
        uid={uid}
        busy={busy}
        onForceSync={handleForceSync}
        onFetch={fetchSnapshot}
        onApply={() => applySnapshotToStores(snapshot)}
        onSync={syncStoresToIndexedDb}
        lastFetchedAt={lastFetchedAt}
        lastStoreSyncAt={lastStoreSyncAt}
        lastIndexDbSyncAt={lastIndexDbSyncAt}
      />

      <ForceSyncSnapshot uid={uid} snapshot={snapshot} onDelete={handleDelete} />
    </div>
  );
};

export default ForceSyncPanel;
