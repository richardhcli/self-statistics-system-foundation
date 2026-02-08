import React, { useMemo, useState } from "react";
import { CloudDownload, RotateCw, Zap } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { deserializeRootState, serializeRootState } from "@/stores/root";
import {
  buildRootStateFromSnapshot,
  fetchBackendDatastoreSnapshot,
  type BackendDatastoreSnapshot,
} from "../utils/datastore-sync";
import JsonContainerRenderer, {
  type FirestoreDeleteTarget,
} from "../utils/json-container-renderer";
import {
  deleteFirestoreCollection,
  deleteFirestoreDocument,
  deleteFirestoreField,
  removeFirestoreArrayValue,
} from "@/lib/firebase/firestore-crud";
import type { DatastoreConsoleStatus } from "./datastores-console";

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

  const sections = useMemo(() => {
    if (!uid || !snapshot) return [];

    return [
      {
        label: "User Profile",
        rootPath: `users/${uid}`,
        rootKind: "doc" as const,
        data: snapshot.userProfile ?? {},
      },
      {
        label: "Account Config",
        rootPath: `users/${uid}/account-config`,
        rootKind: "collection" as const,
        data: snapshot.accountConfig ?? {},
      },
      {
        label: "User Information",
        rootPath: `users/${uid}/user-information`,
        rootKind: "collection" as const,
        data: snapshot.userInformation ?? {},
      },
      {
        label: "Journal Tree",
        rootPath: `users/${uid}/journal_meta/tree_structure`,
        rootKind: "doc" as const,
        data: snapshot.journalTree ?? {},
      },
      {
        label: "Journal Entries",
        rootPath: `users/${uid}/journal_entries`,
        rootKind: "collection" as const,
        data: snapshot.journalEntries ?? {},
      },
    ];
  }, [snapshot, uid]);

  const busy = isFetching || isApplying || isSyncing;

  return (
    <div className="space-y-6">
      <div className="bg-white border-2 border-slate-900 p-6 shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] rounded-2xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-black uppercase text-slate-900">
              Force Sync Orchestrator
            </h4>
            <p className="text-xs text-slate-500">
              Fetch from Firestore, hydrate stores, then flush to IndexedDB.
            </p>
          </div>
          <button
            type="button"
            onClick={handleForceSync}
            disabled={!uid || busy}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-40"
          >
            <RotateCw className="w-4 h-4" />
            Force Sync
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6">
          <button
            type="button"
            onClick={fetchSnapshot}
            disabled={!uid || busy}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            <CloudDownload className="w-4 h-4" />
            Fetch Backend
          </button>
          <button
            type="button"
            onClick={() => applySnapshotToStores(snapshot)}
            disabled={!uid || busy}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            <Zap className="w-4 h-4" />
            Apply to Stores
          </button>
          <button
            type="button"
            onClick={syncStoresToIndexedDb}
            disabled={!uid || busy}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
          >
            <RotateCw className="w-4 h-4" />
            Sync to IndexedDB
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px] font-bold text-slate-400 uppercase">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            Last Fetch: {lastFetchedAt ?? "--"}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            Last Store Sync: {lastStoreSyncAt ?? "--"}
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            Last IndexedDB Sync: {lastIndexDbSyncAt ?? "--"}
          </div>
        </div>

        {!uid ? (
          <p className="mt-4 text-xs text-red-500">
            Sign in to access backend datastores.
          </p>
        ) : null}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-black uppercase text-white">
            Backend Snapshot
          </h4>
          <span className="text-[10px] uppercase text-slate-400">
            {snapshot ? "Loaded" : "No data"}
          </span>
        </div>

        {snapshot ? (
          <div className="space-y-6">
            {sections.map((section) => (
              <JsonContainerRenderer
                key={section.label}
                label={section.label}
                data={section.data}
                rootPath={section.rootPath}
                rootKind={section.rootKind}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Fetch backend data to inspect Firestore state.
          </p>
        )}
      </div>
    </div>
  );
};

export default ForceSyncPanel;
