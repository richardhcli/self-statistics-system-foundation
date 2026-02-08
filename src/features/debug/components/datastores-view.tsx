import React, { useCallback, useState } from "react";
import DatastoresConsole, {
  type DatastoreConsoleEntry,
  type DatastoreConsoleStatus,
} from "./datastores-console";
import LocalDatastoreView from "./local-datastore-view";
import DatabaseView from "./database-view";

const MAX_CONSOLE_ENTRIES = 12;

/**
 * DatastoresView
 *
 * Split view for local datastores and backend database tooling.
 */
const DatastoresView: React.FC = () => {
  const [entries, setEntries] = useState<DatastoreConsoleEntry[]>([]);

  const handleLog = useCallback(
    (message: string, status: DatastoreConsoleStatus = "info") => {
      setEntries((prev) => {
        const id = typeof crypto.randomUUID === "function"
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;
        const nextEntry: DatastoreConsoleEntry = {
          id,
          message,
          status,
          timestamp: new Date().toLocaleTimeString(),
        };
        return [nextEntry, ...prev].slice(0, MAX_CONSOLE_ENTRIES);
      });
    },
    []
  );

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-6xl mx-auto space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <DatastoresConsole entries={entries} />
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <DatabaseView onLog={handleLog} />
          <LocalDatastoreView />
        </div>
      </div>
    </div>
  );
};

export default DatastoresView;
