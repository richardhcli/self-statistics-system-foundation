
import React from 'react';
import { Activity, ShieldCheck } from 'lucide-react';
import { IntegrationConfig } from '../types';

interface IntegrationHeaderProps {
  config: IntegrationConfig;
  onToggle: () => void;
}

/**
 * Component: IntegrationHeader
 * 
 * Functional Description:
 * Provides the top-level identity for the Integrations module. 
 * It manages the primary "enabled" state of the webhook system through a visual status toggle.
 * When disabled, the application suppresses all outbound network activity related to integrations.
 */
export const IntegrationHeader: React.FC<IntegrationHeaderProps> = ({ config, onToggle }) => {
  return (
    <div className="flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-500">
      <div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Integrations</h2>
        <p className="text-slate-500 font-medium max-w-md">
          Connect your Neural Second Brain to the outside world via real-time outbound webhooks.
        </p>
      </div>
      
      {/* Global Toggle: Controls whether triggerIntegration() initiates fetch calls */}
      <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-[10px] font-black uppercase text-slate-400 px-2 tracking-widest">Global Engine</span>
        <button 
          onClick={onToggle}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            config.enabled 
              ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-100' 
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {config.enabled ? <ShieldCheck className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
          {config.enabled ? 'Active' : 'Disabled'}
        </button>
      </div>
    </div>
  );
};
