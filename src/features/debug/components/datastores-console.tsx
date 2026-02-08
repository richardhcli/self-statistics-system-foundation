import React from "react";
import { Terminal } from "lucide-react";

export type DatastoreConsoleStatus = "info" | "success" | "warning" | "error";

export interface DatastoreConsoleEntry {
  id: string;
  message: string;
  status: DatastoreConsoleStatus;
  timestamp: string;
}

const statusStyles: Record<DatastoreConsoleStatus, string> = {
  info: "text-indigo-300",
  success: "text-emerald-400",
  warning: "text-amber-400",
  error: "text-red-400",
};

interface DatastoresConsoleProps {
  entries: DatastoreConsoleEntry[];
}

const DatastoresConsole: React.FC<DatastoresConsoleProps> = ({ entries }) => {
  return (
    <div className="bg-slate-900 text-indigo-400 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4 opacity-10">
        <Terminal className="w-20 h-20" />
      </div>
      <div className="flex items-center gap-3 mb-4 relative z-10">
        <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
        <h4 className="text-sm font-black uppercase tracking-widest text-white">
          Datastores Console
        </h4>
      </div>
      <div className="space-y-2 font-mono text-xs relative z-10 max-h-[160px] overflow-y-auto pr-4">
        {entries.length === 0 ? (
          <p className="text-slate-500">:: [CONSOLE] NO EVENTS YET</p>
        ) : (
          entries.map((entry) => (
            <p key={entry.id} className={statusStyles[entry.status]}>
              :: [{entry.timestamp}] {entry.message}
            </p>
          ))
        )}
      </div>
    </div>
  );
};

export default DatastoresConsole;
