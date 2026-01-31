import React from 'react';
import { Globe, Trash2, Send } from 'lucide-react';
import { IntegrationLog } from '../types';
import { LogItem } from './log-item';

interface TransmissionLogsProps {
  logs: IntegrationLog[];
  onClear: () => void;
}

/**
 * Component: TransmissionLogs
 * 
 * Functional Description:
 * Serves as a diagnostic feed for all integration events. 
 * Lists outgoing requests in reverse chronological order (newest first).
 * Provides a "Clear" action to purge local IndexedDB log history.
 */
export const TransmissionLogs: React.FC<TransmissionLogsProps> = ({ logs, onClear }) => {
  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
      <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <div className="flex items-center gap-3">
          <Globe className="w-5 h-5 text-slate-400" />
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Transmission Logs</h3>
        </div>
        
        {logs.length > 0 && (
          <button 
            onClick={onClear}
            className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
            title="Purge All Logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear History
          </button>
        )}
      </div>

      <div className="min-h-[200px] max-h-[600px] overflow-y-auto integration-log-area">
        {logs.length > 0 ? (
          <div className="flex flex-col">
            {[...logs].reverse().map((log) => (
              <LogItem key={log.id} log={log} />
            ))}
          </div>
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center text-slate-300">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 opacity-20" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em]">No transmissions recorded</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-2">Activate the engine to start monitoring events</p>
          </div>
        )}
      </div>
    </section>
  );
};