import React, { useState } from 'react';
import { usePersistence } from '@/hooks/use-persistence';
import MainLayout from '@/components/layout/main-layout';
import { AppView } from '@/components/layout/header';
import JournalFeature from '@/features/journal/components/journal-feature';
import { GraphView } from '@/features/visual-graph';
import { DeveloperGraphView } from '@/features/developer-graph';
import { StatisticsView } from '@/features/statistics';
import { BillingView } from '@/features/billing';
import { SettingsView } from '@/features/settings';
import { DebugView } from '@/features/debug';
import { IntegrationView, sendWebhook } from '@/features/integration';
import { sendToObsidian } from '@/features/integration/api/obsidian-service';
import { useUserIntegrations, useUserIntegrationsActions } from '@/stores/user-integrations';
import { clearIndexedDB } from '@/testing';

// Clear IndexedDB on app load (debugging hydration issues)
// TEMPORARY: Remove this after debugging
console.warn("[App] Clearing IndexedDB for debugging purposes. Remove in final app.");
clearIndexedDB().catch(console.error);

const App: React.FC = () => {
  const { isInitialized } = usePersistence();
  const [view, setView] = useState<AppView>('journal');

  // Show loading state until persistence is initialized
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Initializing application...</p>
        </div>
      </div>
    );
  }

  return <AppContent view={view} setView={setView} />;
};

/**
 * App Content Component
 * Separated to avoid Rules of Hooks violations with early returns
 */
const AppContent: React.FC<{ view: AppView; setView: (view: AppView) => void }> = ({ view, setView }) => {
  const integrations = useUserIntegrations();
  const { addLog, clearLogs } = useUserIntegrationsActions();

  // Global Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K: Focus Journal
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setView('journal');
        const input = document.querySelector('textarea');
        if (input) input.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  /**
   * Integration event handler
   * Triggered by journal feature after AI processing
   * Handles webhooks and Obsidian sync
   */
  const handleIntegrationEvent = async (eventName: string, payload: any) => {
    const webhookConfig = integrations.config;
    const obsidianConfig = integrations.obsidianConfig;
    
    const isWebhookEnabled = webhookConfig?.enabled && webhookConfig?.webhookUrl;
    const isObsidianEnabled = obsidianConfig?.enabled;

    if (!isWebhookEnabled && !isObsidianEnabled) return;

    const logId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (isWebhookEnabled && webhookConfig?.webhookUrl) {
      addLog({
        id: logId,
        timestamp,
        eventName,
        payload,
        status: 'pending'
      });

      const result = await sendWebhook(webhookConfig.webhookUrl, payload, eventName);
      
      // Update log status
      const updatedLogs = integrations.logs.map(log => 
        log.id === logId 
          ? { ...log, status: result.success ? 'success' : 'error', response: result.response } 
          : log
      );
      clearLogs();
      updatedLogs.forEach(log => addLog(log));
    }

    if (isObsidianEnabled && eventName === 'JOURNAL_AI_PROCESSED') {
      const obsidianLogId = crypto.randomUUID();
      
      addLog({
        id: obsidianLogId,
        timestamp: new Date().toISOString(),
        eventName: 'OBSIDIAN_SYNC',
        payload,
        status: 'pending'
      });

      const obsidianPayload = {
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
        content: payload.originalText,
        metadata: { analysis: payload.analysis }
      };

      const obsResult = await sendToObsidian(obsidianConfig, obsidianPayload);

      // Update log status
      const updatedLogs = integrations.logs.map(log => 
        log.id === obsidianLogId 
          ? { ...log, status: obsResult.success ? 'success' : 'error', response: obsResult.response } 
          : log
      );
      clearLogs();
      updatedLogs.forEach(log => addLog(log));
    }
  };

  return (
    <MainLayout view={view} setView={setView}>
      {view === 'journal' && (
        <JournalFeature onIntegrationEvent={handleIntegrationEvent} />
      )}
      {view === 'graph' && <GraphView />}
      {view === 'dev-graph' && <DeveloperGraphView />}
      {view === 'statistics' && <StatisticsView />}
      {view === 'integrations' && <IntegrationView />}
      {view === 'billing' && <BillingView />}
      {view === 'settings' && <SettingsView />}
      {view === 'debug' && <DebugView />}
    </MainLayout>
  );
};

export default App;