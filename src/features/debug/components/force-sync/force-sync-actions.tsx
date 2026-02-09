/**
 * ForceSyncActions
 *
 * Renders the backend fetch/apply/indexeddb controls for debug sync.
 */

import React from "react";
import { CloudDownload, RotateCw, Zap } from "lucide-react";

interface ForceSyncActionsProps {
  uid?: string;
  busy: boolean;
  onForceSync: () => void;
  onFetch: () => void;
  onApply: () => void;
  onSync: () => void;
  lastFetchedAt: string | null;
  lastStoreSyncAt: string | null;
  lastIndexDbSyncAt: string | null;
}

const ForceSyncActions: React.FC<ForceSyncActionsProps> = ({
  uid,
  busy,
  onForceSync,
  onFetch,
  onApply,
  onSync,
  lastFetchedAt,
  lastStoreSyncAt,
  lastIndexDbSyncAt,
}) => {
  return (
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
          onClick={onForceSync}
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
          onClick={onFetch}
          disabled={!uid || busy}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
        >
          <CloudDownload className="w-4 h-4" />
          Fetch Backend
        </button>
        <button
          type="button"
          onClick={onApply}
          disabled={!uid || busy}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-50 border-2 rounded-xl text-[10px] font-black uppercase tracking-widest disabled:opacity-40"
        >
          <Zap className="w-4 h-4" />
          Apply to Stores
        </button>
        <button
          type="button"
          onClick={onSync}
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
  );
};

export default ForceSyncActions;
