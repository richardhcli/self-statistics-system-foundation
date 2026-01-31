
import React from 'react';
import { AppData, ObsidianConfig } from '@/types';
import { IntegrationHeader } from './integration-header';
import { WebhookConfig } from './webhook-config';
import { ObsidianConfigPanel } from './obsidian-config';
import { TransmissionLogs } from './transmission-logs';
import { DataPortability } from './data-portability';

interface IntegrationViewProps {
  data: AppData;
  setData: React.Dispatch<React.SetStateAction<AppData>>;
}

/**
 * Component: IntegrationView
 * 
 * Functional Description:
 * The main orchestrator for the Integrations tab. 
 * It manages the root integration state and maps it to specialized sub-components 
 * for better modularity and code readability.
 */
const IntegrationView: React.FC<IntegrationViewProps> = ({ data, setData }) => {
  // Safe access with defaults to ensure robust rendering even on first load
  const store = data.integrations || { 
    config: { webhookUrl: '', enabled: false }, 
    obsidianConfig: { enabled: false, host: '127.0.0.1', port: '27124', apiKey: '', useHttps: false, targetFolder: 'Journal/AI' },
    logs: [] 
  };

  /**
   * Updates the global 'enabled' status.
   */
  const handleToggle = () => {
    setData(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        config: { ...prev.integrations.config, enabled: !prev.integrations.config.enabled }
      }
    }));
  };

  /**
   * Persists the webhook URL to the application store.
   */
  const handleSaveUrl = (url: string) => {
    setData(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        config: { ...prev.integrations.config, webhookUrl: url }
      }
    }));
  };

  /**
   * Updates Obsidian specific configuration.
   */
  const handleUpdateObsidian = (newObsidianConfig: ObsidianConfig) => {
    setData(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        obsidianConfig: newObsidianConfig
      }
    }));
  };

  /**
   * Purges all recorded transmission logs.
   */
  const handleClearLogs = () => {
    setData(prev => ({
      ...prev,
      integrations: {
        ...prev.integrations,
        logs: []
      }
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Module Navigation & Status Toggle */}
      <IntegrationHeader 
        config={store.config} 
        onToggle={handleToggle} 
      />

      <div className="grid grid-cols-1 gap-8">
        {/* Data Import/Export Utilities */}
        <DataPortability data={data} setData={setData} />

        {/* Network Configuration Form */}
        <WebhookConfig 
          initialUrl={store.config.webhookUrl} 
          onSave={handleSaveUrl} 
        />

        {/* Obsidian Local REST API Configuration */}
        <ObsidianConfigPanel 
          config={store.obsidianConfig} 
          onUpdate={handleUpdateObsidian} 
        />
      </div>

      {/* Historical Transmission Feed */}
      <TransmissionLogs 
        logs={store.logs} 
        onClear={handleClearLogs} 
      />
      
      {/* Feature Footer Note */}
      <div className="pt-4 text-center">
        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
          End-to-End Neural Integration Engine • Secured via Local Persistence
        </p>
      </div>
    </div>
  );
};

export default IntegrationView;
