import React, { useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import MainLayout from '@/components/layout/main-layout';
import { AppView } from '@/components/layout/header';
import JournalFeature from '@/features/journal/components/journal-feature';
import { GraphView } from '@/features/visual-graph';
import { DeveloperGraphView } from '@/features/developer-graph';
import { StatisticsView } from '@/features/statistics';
import { updatePlayerStats } from '@/stores/player-statistics';
import { BillingView } from '@/features/billing';
import { SettingsView } from '@/features/settings';
import { DebugView } from '@/features/debug';
import { IntegrationView, sendWebhook } from '@/features/integration';
import { sendToObsidian } from '@/features/integration/api/obsidian-service';

const App: React.FC = () => {
  const { data, setData, resetData, addTopologyNode, deleteTopologyNode, updateTopologyNode } = useAppData();
  const [view, setView] = useState<AppView>('journal');

  // Global Keyboard Shortcuts
  useEffect(() => {
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
    const isWebhookEnabled = data.integrations?.config.enabled && data.integrations?.config.webhookUrl;
    const isObsidianEnabled = data.integrations?.obsidianConfig?.enabled;

    if (!isWebhookEnabled && !isObsidianEnabled) return;

    const logId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    if (isWebhookEnabled) {
      setData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          logs: [...prev.integrations.logs, {
            id: logId,
            timestamp,
            eventName,
            payload,
            status: 'pending'
          }]
        }
      }));

      const result = await sendWebhook(data.integrations.config.webhookUrl, payload, eventName);
      
      setData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          logs: prev.integrations.logs.map(log => 
            log.id === logId 
              ? { ...log, status: result.success ? 'success' : 'error', response: result.response } 
              : log
          )
        }
      }));
    }

    if (isObsidianEnabled && eventName === 'JOURNAL_AI_PROCESSED') {
      const obsidianLogId = crypto.randomUUID();
      
      setData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          logs: [...prev.integrations.logs, {
            id: obsidianLogId,
            timestamp: new Date().toISOString(),
            eventName: 'OBSIDIAN_SYNC',
            payload,
            status: 'pending'
          }]
        }
      }));

      const obsidianPayload = {
        title: `Journal Entry - ${new Date().toLocaleDateString()}`,
        content: payload.originalText,
        metadata: { analysis: payload.analysis }
      };

      const obsResult = await sendToObsidian(data.integrations.obsidianConfig, obsidianPayload);

      setData(prev => ({
        ...prev,
        integrations: {
          ...prev.integrations,
          logs: prev.integrations.logs.map(log => 
            log.id === obsidianLogId 
              ? { ...log, status: obsResult.success ? 'success' : 'error', response: obsResult.response } 
              : log
          )
        }
      }));
    }
  };

  const recordExperience = (actions: string[], exp: number) => {
    setData(prev => updatePlayerStats(prev, actions, exp).data);
  };

  return (
    <MainLayout view={view} setView={setView} onClearData={resetData}>
      {view === 'journal' && (
        <JournalFeature onIntegrationEvent={handleIntegrationEvent} />
      )}
      {view === 'graph' && <GraphView data={data.visualGraph} />}
      {view === 'dev-graph' && (
        <DeveloperGraphView 
          data={data} 
          setData={setData} 
          addTopologyNode={addTopologyNode} 
          deleteTopologyNode={deleteTopologyNode} 
        />
      )}
      {view === 'statistics' && <StatisticsView data={data} setData={setData} />}
      {view === 'integrations' && <IntegrationView data={data} setData={setData} />}
      {view === 'billing' && <BillingView />}
      {view === 'settings' && <SettingsView data={data} setData={setData} />}
      {view === 'debug' && (
        <DebugView 
          data={data} 
          setData={setData} 
          addTopologyNode={addTopologyNode} 
          deleteTopologyNode={deleteTopologyNode} 
          updateTopologyNode={updateTopologyNode} 
          recordExperience={recordExperience} 
        />
      )}
    </MainLayout>
  );
};

export default App;