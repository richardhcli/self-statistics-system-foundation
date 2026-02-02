import React, { useState } from 'react';
import { useCreateJournalEntry } from '@/features/journal/api/create-entry';
import { useJournalActions } from '@/stores/journal';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { useJournal } from '@/stores/journal';
import { processVoiceToText } from '@/lib/google-ai';
import JournalView from './journal-view';
import ManualEntryForm from './manual-entry-form';
import VoiceRecorder from './voice-recorder';

/**
 * JournalFeature
 * 
 * Self-contained journal feature module responsible for:
 * 1. Getting user input (voice recorder + manual entry form)
 * 2. Updating global journal store immediately before processing
 * 3. Displaying journal entries with Pattern C hooks
 * 
 * Architecture:
 * - Uses global journal store (stores/journal) for persistent journal data
 * - Uses local useState for ephemeral UI state (processing flags)
 * - Handles all journal-related business logic internally
 * - Provides integration points for webhooks/external systems via callbacks
 */
import { JournalFeatureProps } from '../types';

const JournalFeature: React.FC<JournalFeatureProps> = ({ onIntegrationEvent }) => {
  const journal = useJournal();
  const journalActions = useJournalActions();
  const createJournalEntry = useCreateJournalEntry();
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * Handle voice input
   * 1. Process voice to text via Google AI
   * 2. Create journal entry with AI analysis
   * 3. Trigger integration events
   */
  const handleVoice = async (audioBase64: string) => {
    setIsProcessing(true);
    try {
      const journalInfo = await processVoiceToText(audioBase64);
      await createJournalEntry({ 
        entry: journalInfo.content, 
        useAI: true, 
        dateInfo: journalInfo 
      });

      if (onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: journalInfo.content,
          timestamp: journalInfo.time
        });
      }
    } finally { 
      setIsProcessing(false); 
    }
  };

  /**
   * Handle quick manual entry (from journal view inline)
   * 1. If empty, just create placeholder in journal store
   * 2. If has content, process with AI and update store
   * 3. Trigger integration events
   */
  const handleManualQuickEntry = async (y: string, m: string, d: string, content: string) => {
    if (!content.trim()) {
      // Empty entry - just create placeholder for UI
      const dateObj = getNormalizedDate({ year: y, month: m, day: d });
      const dateKey = `${dateObj.year}/${dateObj.month}/${dateObj.day}/${dateObj.time}`;
      journalActions.upsertEntry(dateKey, { content } as any);
      return;
    }

    setIsProcessing(true);
    try { 
      await createJournalEntry({ 
        entry: content, 
        useAI: true, 
        dateInfo: { year: y, month: m, day: d } 
      });

      if (onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: content,
          source: 'manual_quick'
        });
      }
    } finally { 
      setIsProcessing(false); 
    }
  };

  /**
   * Handle detailed manual entry (from manual entry form)
   * Supports custom time, duration, actions, and AI toggle
   */
  const handleDetailedManualEntry = async (payload: {
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

      if (payload.useAI && onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: payload.content,
          source: 'manual_detailed',
          duration: payload.duration,
          actions: payload.actions
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle re-parsing an existing entry
   * Useful when user wants to re-analyze an entry with AI
   */
  const handleParseEntry = async (year: string, month: string, day: string, time: string) => {
    const entry = journal[year]?.[month]?.[day]?.[time];
    if (!entry || !entry.content) return;

    setIsProcessing(true);
    try {
      await createJournalEntry({
        entry: entry.content,
        useAI: true,
        dateInfo: { year, month, day, time },
        duration: entry.duration
      });

      if (onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: entry.content,
          source: 'reparse',
          timestamp: `${year}-${month}-${day} ${time}`
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
      {/* Left Sidebar - Input Controls */}
      <div className="lg:col-span-1 space-y-6">
        {/* Voice Recorder Card */}
        <div className="sticky top-24">
          <VoiceRecorder onProcessed={handleVoice} isProcessing={isProcessing} />
        </div>
        
        {/* Manual Entry Form */}
        <ManualEntryForm onSubmit={handleDetailedManualEntry} isProcessing={isProcessing} />
      </div>

      {/* Right Content - Journal View */}
      <div className="lg:col-span-2">
        <JournalView 
          data={journal} 
          onAddManualEntry={handleManualQuickEntry}
          onParseEntry={handleParseEntry}
          isProcessing={isProcessing}
        />
      </div>
    </div>
  );
};

export default JournalFeature;
