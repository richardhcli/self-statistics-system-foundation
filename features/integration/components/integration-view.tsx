
import React from 'react';
import { ObsidianConfig } from '@/types';
import { useUserIntegrations, useUserIntegrationsActions } from '@/stores/user-integrations';
import { IntegrationHeader } from './integration-header';
import { WebhookConfig } from './webhook-config';
import { ObsidianConfigPanel } from './obsidian-config';
import { TransmissionLogs } from './transmission-logs';
import { DataPortability } from './data-portability';

/**
 * Component: IntegrationView
 * 
 * Functional Description:
 * The main orchestrator for the Integrations tab. 
 * It manages the root integration state and maps it to specialized sub-components 
 * for better modularity and code readability.
 */
const IntegrationView: React.FC = () => {
  const integrations = useUserIntegrations();
  const { updateConfig, updateObsidianConfig, clearLogs } = useUserIntegrationsActions();

  /**
   * Updates the global 'enabled' status.
   */
  const handleToggle = () => {
    updateConfig({
      ...integrations.config,
      enabled: !integrations.config.enabled,
    });
  };

  /**
   * Persists the webhook URL to the application store.
   */
  const handleSaveUrl = (url: string) => {
    updateConfig({
      ...integrations.config,
      webhookUrl: url,
    });
  };

  /**
   * Updates Obsidian specific configuration.
   */
  const handleUpdateObsidian = (newObsidianConfig: ObsidianConfig) => {
    updateObsidianConfig(newObsidianConfig);
  };

  /**
   * Purges all recorded transmission logs.
   */
  const handleClearLogs = () => {
    clearLogs();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Module Navigation & Status Toggle */}
      <IntegrationHeader 
        config={integrations.config} 
        onToggle={handleToggle} 
      />

      <div className="grid grid-cols-1 gap-8">
        {/* Data Import/Export Utilities */}
        <DataPortability />

        {/* Network Configuration Form */}
        <WebhookConfig 
          initialUrl={integrations.config.webhookUrl} 
          onSave={handleSaveUrl} 
        />

        {/* Obsidian Local REST API Configuration */}
        <ObsidianConfigPanel 
          config={integrations.obsidianConfig} 
          onUpdate={handleUpdateObsidian} 
        />
      </div>

      {/* Historical Transmission Feed */}
      <TransmissionLogs 
        logs={integrations.logs} 
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
