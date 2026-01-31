
import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp, Code } from 'lucide-react';
import { IntegrationLog } from '../types';

interface LogItemProps {
  log: IntegrationLog;
}

/**
 * Component: LogItem
 * 
 * Functional Description:
 * Displays the outcome of a single webhook attempt.
 * - Colors and icons change based on 'status' (pending, success, error).
 * - Features a collapsible payload view to keep the UI clean while allowing deep inspection.
 */
export const LogItem: React.FC<LogItemProps> = ({ log }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusConfig = () => {
    switch (log.status) {
      case 'success':
        return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
      case 'error':
        return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-50', badge: 'bg-red-50 text-red-600 border-red-100' };
      default:
        return { icon: Clock, color: 'text-slate-400', bg: 'bg-slate-50', badge: 'bg-slate-50 text-slate-400 border-slate-200' };
    }
  };

  const { icon: StatusIcon, color, bg, badge } = getStatusConfig();

  return (
    <div className="p-6 flex flex-col hover:bg-slate-50/50 transition-colors group border-b border-slate-50 last:border-0">
      <div className="flex items-start justify-between">
        <div className="flex gap-4">
          {/* Status Indicator */}
          <div className={`mt-1 p-2 rounded-xl ${bg} ${color} transition-transform group-hover:scale-110`}>
            <StatusIcon className="w-4 h-4" />
          </div>
          
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{log.eventName}</span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {new Date(log.timestamp).toLocaleTimeString()}
              </span>
            </div>
            
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-2 text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:underline decoration-2"
            >
              <Code className="w-3 h-3" />
              {isExpanded ? 'Hide Payload' : 'View Data Stream'}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${badge}`}>
            {log.status}
          </span>
        </div>
      </div>

      {/* Collapsible Inspection Panel */}
      {isExpanded && (
        <div className="mt-4 animate-in slide-in-from-top-2 duration-300">
          <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Post Request Body</span>
              <span className="text-[9px] font-mono text-slate-600">ID: {log.id}</span>
            </div>
            <pre className="text-[10px] font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
            
            {log.response && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Server Response</span>
                <p className="text-[10px] font-mono text-emerald-400 italic break-all">
                  {log.response}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
