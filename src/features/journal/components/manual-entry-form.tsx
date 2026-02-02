
import React, { useState } from 'react';
import { Type, Clock, Hourglass, Tag, Send, Sparkles, Loader2 } from 'lucide-react';
import { ManualEntryFormProps } from '../types';

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ onSubmit, isProcessing }) => {
  const [content, setContent] = useState('');
  const [time, setTime] = useState('');
  const [duration, setDuration] = useState('');
  const [actions, setActions] = useState('');
  const [useAI, setUseAI] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      content,
      time: time || undefined,
      duration: duration || undefined,
      actions: actions.split(',').map(a => a.trim()).filter(Boolean),
      useAI
    });

    // Reset form
    setContent('');
    setTime('');
    setDuration('');
    setActions('');
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Type className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Manual Input</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write your entry here..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none min-h-[120px] transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">
              <Clock className="w-3 h-3" /> Time Input (Optional)
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
          <div className="space-y-1">
            <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">
              <Hourglass className="w-3 h-3" /> Time Taken (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 45 mins"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">
            <Tag className="w-3 h-3" /> Actions (Optional, comma separated)
          </label>
          <input
            type="text"
            placeholder="e.g. Coding, Debugging"
            value={actions}
            onChange={(e) => setActions(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setUseAI(!useAI)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
              useAI ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'
            }`}
          >
            <Sparkles className={`w-3 h-3 ${useAI ? 'animate-pulse' : ''}`} />
            AI Classification: {useAI ? 'ON' : 'OFF'}
          </button>

          <button
            type="submit"
            disabled={isProcessing || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualEntryForm;
