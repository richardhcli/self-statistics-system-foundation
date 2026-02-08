import React, { useMemo, useState, useEffect } from 'react';
import { JournalViewProps } from '../types';
import { ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import JournalEntryItem from './journal-entry-item/index';
import TextOnlyManualEntryForm from './textonly-manual-entry-form';
import { getDateFromId } from '../utils/id-generator';
import { useCachedFetch } from '../hooks/use-cached-fetch';


const JournalView: React.FC<JournalViewProps> = ({ tree, entries, isTreeReady, onAddManualEntry, onParseEntry, processingEntries, feedbackMessage }) => {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [addingToDay, setAddingToDay] = useState<string | null>(null);
  const [manualText, setManualText] = useState('');
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear().toString();
    const m = monthNames[now.getMonth()];
    const d = now.getDate().toString();
    const dayPath = `${y}-${m}-${d}`;
    setExpanded(prev => ({ 
      ...prev, 
      [y]: true, 
      [`${y}-${m}`]: true, 
      [dayPath]: true 
    }));
  }, []);

  const toggleExpanded = (path: string) => {
    setExpanded(prev => ({ ...prev, [path]: !prev[path] }));
  };

  const expandedMonths = useMemo(() => {
    const months: Array<{ year: string; month: string }> = [];
    Object.entries(expanded).forEach(([key, isOpen]) => {
      if (!isOpen) return;
      const parts = key.split('-');
      if (parts.length === 2) {
        const [year, month] = parts;
        if (tree[year]?.months?.[month]) {
          months.push({ year, month });
        }
      }
    });
    return months;
  }, [expanded, tree]);

  useCachedFetch(expandedMonths);

  // Chronological sort: earliest year first
  const years = Object.keys(tree).sort();

  const handleManualSubmit = (y: string, m: string, d: string) => {
    if (!manualText.trim()) return;
    const now = new Date();
    const monthIndex = Math.max(0, parseInt(m, 10) - 1);
    const date = new Date(parseInt(y, 10), monthIndex, parseInt(d, 10), now.getHours(), now.getMinutes(), now.getSeconds());
    onAddManualEntry(manualText, date);
    setManualText('');
    setAddingToDay(null);
  };

  if (!isTreeReady) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
        <Loader2 className="w-12 h-12 mb-2 animate-spin opacity-20" />
        <p>Initializing...</p>
      </div>
    );
  }

  if (years.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
        <p className="text-sm font-semibold">No journal entries yet.</p>
        <p className="text-xs">Create your first entry to populate the timeline.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 journal-scroll-area">
      {years.map(year => (
        <div key={year} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden journal-entry-card">
          <button onClick={() => toggleExpanded(year)} className="w-full flex items-center px-4 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            {expanded[year] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
            <span className="font-black text-slate-800 tracking-tight">{year}</span>
          </button>
          {expanded[year] && <div className="pl-4 pb-2">
            {Object.keys(tree[year]?.months ?? {})
              // Chronological sort: index in monthNames
              .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
              .map(month => {
                const monthPath = `${year}-${month}`;
                const monthLabel = monthNames[Math.max(0, parseInt(month, 10) - 1)] ?? month;
                return <div key={month} className="border-l-2 border-slate-100 ml-2">
                  <button onClick={() => toggleExpanded(monthPath)} className="w-full flex items-center px-4 py-3 hover:bg-slate-50 text-slate-600">
                    {expanded[monthPath] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    <span className="font-bold text-sm uppercase tracking-wider">{monthLabel}</span>
                  </button>
                  {expanded[monthPath] && <div className="pl-4">
                    {Object.keys(tree[year]?.months?.[month]?.days ?? {})
                      .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
                      .map(day => {
                        const dayPath = `${monthPath}-${day}`;
                        const dayEntries = tree[year]?.months?.[month]?.days?.[day]?.entries ?? [];
                        return <div key={day} className="border-l-2 border-slate-100 ml-2">

                          <div className="flex items-center justify-between px-4 py-2">
                            <button onClick={() => toggleExpanded(dayPath)} className="flex items-center text-slate-500">{expanded[dayPath] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}<span className="text-xs font-bold uppercase">Day {day}</span></button>
                            <button onClick={() => setAddingToDay(addingToDay === dayPath ? null : dayPath)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded-lg"><Plus className="w-4 h-4" /></button>
                          </div>

                          {addingToDay === dayPath && (
                            <TextOnlyManualEntryForm
                              value={manualText}
                              onChange={setManualText}
                              onSubmit={() => handleManualSubmit(year, month, day)}
                              isSubmitDisabled={!manualText.trim()}
                            />
                          )}
                          {expanded[dayPath] && <div className="pl-6 py-4 space-y-4 pr-4">
                            {dayEntries
                              .slice()
                              .sort()
                              .map(entryId => {
                                const entry = entries[entryId];
                                if (!entry?.content) return null;
                                const entryDate = getDateFromId(entryId);
                                const displayTime = entryDate
                                  .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                                return (
                                  <JournalEntryItem 
                                    key={entryId}
                                    time={displayTime}
                                    entry={entry}
                                    isProcessing={processingEntries.has(entryId)}
                                    onParseEntry={() => onParseEntry(entryId)}
                                  />
                                );
                              })}
                          </div>}
                        </div>;
                      })}
                  </div>}
                </div>;
              })}
          </div>}
        </div>
      ))}
    </div>
  );
};

export default JournalView;