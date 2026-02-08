import React from "react";
import { Database } from "lucide-react";
import ForceSyncPanel from "./force-sync-panel";
import type { DatastoreConsoleStatus } from "./datastores-console";

interface DatabaseViewProps {
  onLog: (message: string, status?: DatastoreConsoleStatus) => void;
}

/**
 * DatabaseView
 *
 * Hosts backend datastore tooling and force-sync controls.
 */
const DatabaseView: React.FC<DatabaseViewProps> = ({ onLog }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Database className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase text-slate-900">
            Backend Datastores
          </h3>
          <p className="text-xs text-slate-500">
            Pull Firestore data and reconcile local stores.
          </p>
        </div>
      </div>
      <ForceSyncPanel onLog={onLog} />
    </div>
  );
};

export default DatabaseView;
