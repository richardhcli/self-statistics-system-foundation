
import React, { useState, useEffect } from 'react';
import { FileText, Shield, Globe, Folder, Key, Settings2, Power } from 'lucide-react';
import { ObsidianConfig } from '../types';

interface ObsidianConfigProps {
  config: ObsidianConfig;
  onUpdate: (config: ObsidianConfig) => void;
}

/**
 * Component: ObsidianConfig
 * 
 * Functional Description:
 * Manages the connection to the Obsidian "Local REST API" plugin.
 * Allows users to sync their AI-processed journal entries directly into their Obsidian Vault as Markdown notes.
 */
export const ObsidianConfigPanel: React.FC<ObsidianConfigProps> = ({ config, onUpdate }) => {
  const [localConfig, setLocalConfig] = useState<ObsidianConfig>(config);

  useEffect(() => {
    setLocalConfig(config);
  }, [config]);

  const handleChange = (field: keyof ObsidianConfig, value: any) => {
    setLocalConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onUpdate(localConfig);
  };

  return (
    <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-900">Obsidian Integration</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Local REST API Sync</p>
          </div>
        </div>
        <button 
          onClick={() => handleChange('enabled', !localConfig.enabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            localConfig.enabled ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {localConfig.enabled ? 'Connected' : 'Disconnected'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Globe className="w-3 h-3" /> Host Address
          </label>
          <input 
            type="text" 
            value={localConfig.host}
            onChange={(e) => handleChange('host', e.target.value)}
            placeholder="127.0.0.1"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Settings2 className="w-3 h-3" /> Port
          </label>
          <input 
            type="text" 
            value={localConfig.port}
            onChange={(e) => handleChange('port', e.target.value)}
            placeholder="27124"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Key className="w-3 h-3" /> API Auth Token
          </label>
          <input 
            type="password" 
            value={localConfig.apiKey}
            onChange={(e) => handleChange('apiKey', e.target.value)}
            placeholder="Enter your Local REST API Key"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Folder className="w-3 h-3" /> Vault Folder
          </label>
          <input 
            type="text" 
            value={localConfig.targetFolder}
            onChange={(e) => handleChange('targetFolder', e.target.value)}
            placeholder="Journal/AI"
            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-900 focus:ring-4 focus:ring-purple-500/10 outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <button 
            onClick={() => handleChange('useHttps', !localConfig.useHttps)}
            className={`w-10 h-5 rounded-full relative transition-colors ${localConfig.useHttps ? 'bg-purple-600' : 'bg-slate-300'}`}
          >
            <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${localConfig.useHttps ? 'right-1' : 'left-1'}`} />
          </button>
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Use HTTPS (SSL)</span>
        </div>
      </div>

      <div className="pt-4 flex justify-between items-center border-t border-slate-50">
        <a 
          href="https://coddingtonbear.github.io/obsidian-local-rest-api/" 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-[10px] font-bold text-purple-500 hover:underline"
        >
          Plugin Documentation →
        </a>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-slate-900 text-white font-black uppercase text-xs tracking-widest rounded-2xl hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
        >
          Save Configuration
        </button>
      </div>
    </section>
  );
};
