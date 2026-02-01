import React, { useState, useEffect } from 'react';
import { useAppData } from '@/hooks/use-app-data';
import MainLayout from '@/components/layout/main-layout';
import { AppView } from '@/components/layout/header';
import { JournalView, VoiceRecorder, ManualEntryForm, getNormalizedDate, upsertJournalEntry, createJournalEntry } from '@/features/journal';
import { GraphView } from '@/features/visual-graph';
import { DeveloperGraphView } from '@/features/developer-graph';
import { StatisticsView } from '@/features/statistics';
import { updatePlayerStats } from '@/stores/player-statistics';
import { BillingView } from '@/features/billing';
import { SettingsView } from '@/features/settings';
import { DebugView } from '@/features/debug';
import { IntegrationView, sendWebhook } from '@/features/integration';
import { sendToObsidian } from '@/features/integration/api/obsidian-service';
import { processVoiceToText } from '@/lib/google-ai';

const App: React.FC = () => {
  const { data, setData, resetData, addTopologyNode, deleteTopologyNode, updateTopologyNode } = useAppData();
  const [view, setView] = useState<AppView>('journal');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const triggerIntegration = async (eventName: string, payload: any) => {
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

  const handleVoice = async (audioBase64: string) => {
    setIsProcessing(true);
    try {
      const journalInfo = await processVoiceToText(audioBase64);
      await createJournalEntry({ 
        entry: journalInfo.content, 
        useAI: true, 
        dateInfo: journalInfo 
      });

      await triggerIntegration('JOURNAL_AI_PROCESSED', {
        originalText: journalInfo.content,
        timestamp: journalInfo.time
      });
      
      setView('journal');
    } finally { 
      setIsProcessing(false); 
    }
  };

  const handleManual = async (y: string, m: string, d: string, content: string) => {
    if (!content.trim()) {
      upsertJournalEntry(setData, getNormalizedDate({ year: y, month: m, day: d }), { content });
      return;
    }
    setIsProcessing(true);
    try { 
      await createJournalEntry({ 
        entry: content, 
        useAI: true, 
        dateInfo: { year: y, month: m, day: d } 
      });

      await triggerIntegration('JOURNAL_AI_PROCESSED', {
        originalText: content,
        source: 'manual_quick'
      });
    }
    finally { 
      setIsProcessing(false); 
    }
  };

  const handleDetailedManual = async (payload: {
    content: string;
    time?: string;
    duration?: string;
    actions?: string[];
    useAI: boolean;
  }) => {
    setIsProcessing(true);
    try {
      await createJournalEntry({
        entry: payload.content,
        actions: payload.actions,
        useAI: payload.useAI,
        duration: payload.duration,
        dateInfo: payload.time ? { time: payload.time } : undefined
      });

      if (payload.useAI) {
        await triggerIntegration('JOURNAL_AI_PROCESSED', {
          originalText: payload.content,
          source: 'manual_detailed'
        });
      }

      setView('journal');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleParseEntry = async (year: string, month: string, day: string, time: string) => {
    const entry = data.journal[year]?.[month]?.[day]?.[time];
    if (!entry || !entry.content) return;

    setIsProcessing(true);
    try {
      await createJournalEntry({
        entry: entry.content,
        useAI: true,
        dateInfo: { year, month, day, time },
        duration: entry.duration
      });

      await triggerIntegration('JOURNAL_AI_PROCESSED', {
        originalText: entry.content,
        source: 'retroactive_parse'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const recordExperience = (actions: string[], exp: number) => {
    setData(prev => updatePlayerStats(prev, actions, exp).data);
  };

  return (
    <MainLayout view={view} setView={setView} onClearData={resetData}>
      {view === 'journal' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-4 space-y-6">
            <VoiceRecorder onProcessed={handleVoice} isProcessing={isProcessing} />
            <ManualEntryForm onSubmit={handleDetailedManual} isProcessing={isProcessing} />
          </div>
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
            <JournalView 
              data={data.journal} 
              onAddManualEntry={handleManual} 
              onParseEntry={handleParseEntry} 
              isProcessing={isProcessing} 
            />
          </div>
        </div>
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