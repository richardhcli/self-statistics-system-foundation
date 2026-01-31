
import React, { useState, useEffect } from 'react';
import { Link2 } from 'lucide-react';

interface WebhookConfigProps {
  initialUrl: string;
  onSave: (url: string) => void;
}

/**
 * Component: WebhookConfig
 * 
 * Functional Description:
 * Manages the data-entry for the destination Webhook URL.
 * It maintains a local state for the input to provide a responsive typing experience 
 * while requiring an explicit "Update" click to commit the changes to the global store.
 */
export const WebhookConfig: React.FC<WebhookConfigProps> = ({ initialUrl, onSave }) => {
  const [url, setUrl] = useState(initialUrl);

  // Sync internal state if external data changes (e.g. on reset or manual update)
  useEffect(() => {
    setUrl(initialUrl);
  }, [initialUrl]);

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-75">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Link2 className="w-5 h-5" />
        </div>
        <h3 className="text-lg font-black text-slate-900">Webhook Configuration</h3>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Destination URL</label>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="url" 
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://api.yourdomain.com/webhook"
              className="flex-1 px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-300"
            />
            <button 
              onClick={() => onSave(url)}
              className="px-8 py-4 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 hover:-translate-y-0.5 active:translate-y-0 transition-all shadow-xl shadow-slate-200"
            >
              Update Destination
            </button>
          </div>
        </div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed max-w-2xl">
          The system will transmit a structured JSON POST request containing your AI-processed journal data and associated metadata to this endpoint whenever an entry is finalized.
        </p>
      </div>
    </section>
  );
};
