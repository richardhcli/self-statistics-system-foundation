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

/**
 * TEMPORARY: Clear IndexedDB on app load (debugging hydration issues)
 * @deprecated Remove this after debugging is complete
 */
console.warn("[App] Clearing IndexedDB for debugging purposes. Remove in final app.");
clearIndexedDB().catch(console.error);

/**
 * App Component (Root)
 * 
 * Application entry point that manages persistence initialization.
 * Delegates feature composition to AppContent after initialization.
 * 
 * Responsibilities:
 * - Initialize persistence layer
 * - Display loading state during initialization
 * - Manage top-level view state
 * 
 * @returns {JSX.Element} App root or loading screen
 */
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
 * 
 * Composition Root for feature assembly.
 * Separates feature composition from initialization logic to avoid Rules of Hooks violations.
 * 
 * Feature Composition Strategy:
 * - Debug feature receives DeveloperGraphView via graphViewSlot prop
 * - Follows "Slot Pattern" from feature-composition.md
 * - Maintains vertical slice architecture without circular dependencies
 * 
 * @param view - Current active view/route
 * @param setView - Navigation function to switch views
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
   * 
   * Triggered by journal feature after AI processing.
   * Handles webhooks and Obsidian sync based on user configuration.
   * 
   * @param eventName - Event identifier (e.g., 'JOURNAL_AI_PROCESSED')
   * @param payload - Event data to be sent to integrations
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
      {view === 'statistics' && <StatisticsView />}
      {view === 'integrations' && <IntegrationView />}
      {view === 'billing' && <BillingView />}
      {view === 'settings' && <SettingsView />}
      {/* Feature Composition: DeveloperGraphView injected into DebugView's graphViewSlot */}
      {view === 'debug' && (
        <DebugView graphViewSlot={<DeveloperGraphView />} />
      )}
    </MainLayout>
  );
};

export default App;