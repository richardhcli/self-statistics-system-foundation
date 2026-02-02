import React, { useState, useEffect } from 'react';
import { JournalStore, JournalViewProps } from '../types';
import { ChevronRight, ChevronDown, Plus, Loader2 } from 'lucide-react';
import JournalEntryItem from './journal-entry-item/index';
import TextOnlyManualEntryForm from './textonly-manual-entry-form';


const JournalView: React.FC<JournalViewProps> = ({ data, onAddManualEntry, onParseEntry, isProcessing }) => {
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
    if (Object.keys(data).length === 0) onAddManualEntry(y, m, d, "");
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

  // Chronological sort: earliest year first
  const years = Object.keys(data)
    .filter(k => k !== 'metadata')
    .sort();

  const handleManualSubmit = (y: string, m: string, d: string) => {
    if (!manualText.trim()) return;
    onAddManualEntry(y, m, d, manualText);
    setManualText('');
    setAddingToDay(null);
  };

  if (years.length === 0) return <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center"><Loader2 className="w-12 h-12 mb-2 animate-spin opacity-20" /><p>Initializing...</p></div>;

  return (
    <div className="space-y-4 journal-scroll-area">
      {years.map(year => (
        <div key={year} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden journal-entry-card">
          <button onClick={() => toggleExpanded(year)} className="w-full flex items-center px-4 py-4 bg-slate-50/50 hover:bg-slate-50 transition-colors">
            {expanded[year] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
            <span className="font-black text-slate-800 tracking-tight">{year}</span>
          </button>
          {expanded[year] && <div className="pl-4 pb-2">
            {Object.keys(data[year])
              .filter(k => k !== 'metadata')
              // Chronological sort: index in monthNames
              .sort((a, b) => monthNames.indexOf(a) - monthNames.indexOf(b))
              .map(month => {
                const monthPath = `${year}-${month}`;
                return <div key={month} className="border-l-2 border-slate-100 ml-2">
                  <button onClick={() => toggleExpanded(monthPath)} className="w-full flex items-center px-4 py-3 hover:bg-slate-50 text-slate-600">
                    {expanded[monthPath] ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                    <span className="font-bold text-sm uppercase tracking-wider">{month}</span>
                  </button>
                  {expanded[monthPath] && <div className="pl-4">
                    {Object.keys(data[year][month])
                      .filter(k => k !== 'metadata')

                      // Chronological sort: numeric day value
                      .sort((a, b) => parseInt(a) - parseInt(b))
                      .map(day => {
                        const dayPath = `${monthPath}-${day}`;
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
                            {Object.keys(data[year][month][day])
                              .filter(k => k !== 'metadata')
                              // Chronological sort: earliest time first
                              .sort()
                              .map(time => {
                                const entry = data[year][month][day][time];
                                if (!entry.content) return null;
                                return (
                                  <JournalEntryItem 
                                    key={time}
                                    time={time}
                                    entry={entry}
                                    isProcessing={isProcessing}
                                    onParseEntry={() => onParseEntry(year, month, day, time)}
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