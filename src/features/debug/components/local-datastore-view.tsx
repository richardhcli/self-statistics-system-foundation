import React from "react";
import { Monitor } from "lucide-react";
import DataInjectionPanel from "./data-injection-panel";
import PersistenceView from "./persistence-view";

/**
 * LocalDatastoreView
 *
 * Aggregates local-only datastore tools (injection + persistence view).
 */
const LocalDatastoreView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <Monitor className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase text-slate-900">
            Local Datastores
          </h3>
          <p className="text-xs text-slate-500">
            Inspect and seed local IndexedDB-backed state.
          </p>
        </div>
      </div>
      <DataInjectionPanel />
      <PersistenceView />
    </div>
  );
};

export default LocalDatastoreView;
