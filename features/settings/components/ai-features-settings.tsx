import React from 'react';
import { Sparkles, Gauge, Cpu, ShieldCheck } from 'lucide-react';
import { useAiConfig, useAiConfigActions } from '@/stores/ai-config';

const AIFeaturesSettings: React.FC = () => {
  const config = useAiConfig();
  const { updateModel, updateTemperature, updateVoiceSettings } = useAiConfigActions();

  const updateConfig = (updates: Partial<typeof config>) => {
    if (updates.model !== undefined) updateModel(updates.model);
    if (updates.temperature !== undefined) updateTemperature(updates.temperature);
    if (updates.liveTranscription !== undefined || updates.voiceSensitivity !== undefined) {
      updateVoiceSettings(
        updates.liveTranscription ?? config.liveTranscription,
        updates.voiceSensitivity ?? config.voiceSensitivity
      );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Neural Processing</h3>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 ml-8">Tune the cognitive engine and classification behavior.</p>
        </div>

        <div className="p-8 space-y-8">
          {/* Service Status Info - Prohibited from asking for Key UI, so showing managed state */}
          <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-indigo-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight">API Management</h4>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Service connected via secure system-level environment.</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-200 dark:shadow-none">
              Authenticated
            </span>
          </div>

          {/* Model Selection */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Cpu className="w-3.5 h-3.5" /> Logical Model
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { id: 'gemini-3-flash-preview', name: 'Flash Optimized', desc: 'Fast, efficient classification' },
                { id: 'gemini-3-pro-preview', name: 'Pro Reasoning', desc: 'Deep semantic understanding' }
              ].map((m) => (
                <button
                  key={m.id}
                  onClick={() => updateConfig({ model: m.id })}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    config.model === m.id 
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-900/10' 
                      : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 opacity-60 hover:opacity-100'
                  }`}
                >
                  <h5 className="text-xs font-black uppercase text-slate-900 dark:text-white">{m.name}</h5>
                  <p className="text-[10px] text-slate-500 font-medium mt-1">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Input Dynamics (Live Transcription Toggle) */}
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
              <Gauge className="w-3.5 h-3.5" /> Input Dynamics
            </label>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
              <div>
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-tight">Better Voice Detection</span>
                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Show text feedback as it is being spoken.</p>
              </div>
              <button 
                onClick={() => updateConfig({ liveTranscription: !config.liveTranscription })}
                className={`w-12 h-6 rounded-full relative transition-all duration-300 ${config.liveTranscription ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ${config.liveTranscription ? 'left-7' : 'left-1'}`} />
              </button>
            </div>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cognitive Temperature is locked to 0.0 for maximum deterministic output.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIFeaturesSettings;