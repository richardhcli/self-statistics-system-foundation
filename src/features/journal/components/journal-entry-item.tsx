import React, { useState } from 'react';
import { Clock, Hourglass, Zap, Sparkles, Loader2, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { JournalEntryItemProps } from '../types';
import { EntryResults } from './journal-entry-item/entry-results';
import { minutesToText } from '../utils/journal-entry-utils';

/**
 * Component: JournalEntryItem
 * 
 * Functional Description:
 * Displays a single journal entry with metadata (time, duration, exp), content,
 * action tags, and optional AI analysis button. Supports toggling detailed results.
 * 
 * @param {JournalEntryItemProps} props - Component properties
 * @param {string} props.time - Entry timestamp
 * @param {JournalEntryData} props.entry - Entry data object
 * @param {boolean} props.isProcessing - Whether AI analysis is in progress
 * @param {() => void} props.onParseEntry - Callback to trigger AI analysis
 */
const JournalEntryItem: React.FC<JournalEntryItemProps> = ({ time, entry, isProcessing, onParseEntry }) => {
  const [showResults, setShowResults] = useState(false);
  const isParsed = entry.metadata.flags.aiAnalyzed && Object.keys(entry.actions).length > 0;
  const hasResults = !!entry.result?.nodeIncreases;
  
  // Format the time string to HH:mm:ss
  const displayTime = time.split('.')[0];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all overflow-hidden group">
      <div className="flex min-h-[120px]">
        {/* Left Side: Metadata (Narrow) */}
        <div className="w-24 sm:w-32 bg-slate-50/50 p-4 flex flex-col justify-between items-center border-r border-slate-100 shrink-0">
          <div className="flex flex-col items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] font-black text-slate-500 tracking-widest">{displayTime}</span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {entry.metadata.duration ? (
              <>
                <Hourglass className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-tighter text-center leading-tight">
                  {minutesToText(entry.metadata.duration)}
                </span>
              </>
            ) : (
              <div className="h-8" /> 
            )}
          </div>

          <div className="flex flex-col items-center gap-1">
            {entry.result ? (
              <>
                <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span className="text-[10px] font-black text-slate-600">
                  +{entry.result.totalExpIncrease.toFixed(1)}
                </span>
              </>
            ) : (
              <div className="h-8" />
            )}
          </div>
        </div>

        {/* Right Side: Content (Wide) */}
        <div className="flex-1 p-5 flex flex-col justify-between">
          <p className="text-slate-700 text-sm leading-relaxed font-medium mb-4">
            {entry.content}
          </p>

          <div className="mt-auto pt-2 border-t border-slate-50 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              {isParsed ? (
                <div className="flex flex-wrap gap-2 animate-in fade-in duration-500">
                  {Object.entries(entry.actions).map(([action, weight], idx) => (
                    <span key={`action-${idx}`} className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100/50">
                      <Tag className="w-2.5 h-2.5" />
                      {action}
                      {entry.metadata.flags.aiAnalyzed && (
                        <span className="ml-1 opacity-40 font-mono text-[8px]">({((weight as number) * 100).toFixed(0)}%)</span>
                      )}
                    </span>
                  ))}
                </div>
              ) : (
                <button 
                  onClick={onParseEntry} 
                  disabled={isProcessing} 
                  className="flex items-center gap-2 px-3 py-1.5 bg-white text-amber-600 rounded-xl text-[10px] font-black uppercase border border-amber-200 hover:bg-amber-50 hover:border-amber-300 transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  AI Analyze Entry
                </button>
              )}

              {hasResults && (
                <button 
                  onClick={() => setShowResults(!showResults)}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  {showResults ? (
                    <>Hide Results <ChevronUp className="w-3 h-3" /></>
                  ) : (
                    <>Show Results <ChevronDown className="w-3 h-3" /></>
                  )}
                </button>
              )}
            </div>

            {/* Results Dropdown */}
            {showResults && entry.result?.nodeIncreases && (
              <EntryResults nodeIncreases={entry.result.nodeIncreases} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalEntryItem;
