import React, { useState } from 'react';
import { useCreateJournalEntry } from '@/features/journal/api/create-entry';
import { useJournalActions } from '@/stores/journal';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { useJournal } from '@/stores/journal';
import { JournalEntryData, JournalFeatureProps } from '../types';
import JournalView from './journal-view';
import ManualEntryForm from './manual-entry-form';
import VoiceRecorder from './voice-recorder';

/**
 * JournalFeature - Simplified voice transcription architecture.
 * 
 * Responsibilities:
 * 1. Capture user input (voice transcription + manual entry form)
 * 2. Process entries with AI analysis
 * 3. Display journal entries with hierarchical view
 * 
 * Voice Recording Flow (Simplified):
 * - User speaks → real-time transcription display
 * - Transcription passed to parent every 3 seconds
 * - User manually submits transcribed text when done
 * - No automatic processing, no date/time extraction
 * 
 * Architecture:
 * - Uses global journal store (stores/journal) for persistent data
 * - Uses local useState for ephemeral UI state (processing flags, transcribed text)
 * - Handles all journal-related business logic internally
 * - Provides integration points for webhooks/external systems via callbacks
 */

const JournalFeature: React.FC<JournalFeatureProps> = ({ onIntegrationEvent }) => {
  const journal = useJournal();
  const journalActions = useJournalActions();
  const createJournalEntry = useCreateJournalEntry();
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscription, setVoiceTranscription] = useState('');

  /**
   * Handle live voice transcription updates.
   * Called every 3 seconds during recording with latest transcription.
   * Stores text locally for user to review and submit manually.
   * 
   * @param {string} text - Latest transcribed text from voice recorder
   */
  const handleVoiceTranscription = (text: string) => {
    setVoiceTranscription(text);
  };

  /**
   * Handle quick manual entry (from journal view inline)
   * 1. If empty, just create placeholder in journal store
   * 2. If has content, process WITHOUT AI and update store
   */
  const handleManualQuickEntry = async (y: string, m: string, d: string, content: string) => {
    if (!content.trim()) {
      // Empty entry - just create placeholder for UI
      const dateObj = getNormalizedDate({ year: y, month: m, day: d });
      const dateKey = `${dateObj.year}/${dateObj.month}/${dateObj.day}/${dateObj.time}`;
      const placeholderEntry: JournalEntryData = {
        content,
        actions: {},
        metadata: {
          flags: { aiAnalyzed: false },
          timePosted: new Date().toISOString()
        }
      };
      journalActions.upsertEntry(dateKey, placeholderEntry);
      return;
    }

    setIsProcessing(true);
    try { 
      await createJournalEntry({ 
        entry: content, 
        useAI: false, 
        dateInfo: { year: y, month: m, day: d } 
      });
    } finally { 
      setIsProcessing(false); 
    }
  };

  /**
   * Handle detailed manual entry (from manual entry form)
   * AI classification is always enabled for this form
   */
  const handleDetailedManualEntry = async (payload: {
    content: string;
    duration?: string;
  }) => {
    setIsProcessing(true);
    try {
      await createJournalEntry({
        entry: payload.content,
        useAI: true,
        duration: payload.duration,
      });

      if (onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: payload.content,
          source: 'manual_detailed',
          duration: payload.duration,
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
        duration: entry.metadata.duration
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
          <VoiceRecorder onTranscription={handleVoiceTranscription} />
          
          {/* Display transcribed text and allow submission */}
          {voiceTranscription && (
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Transcribed Text:</p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3 italic">{voiceTranscription}</p>
              <button
                onClick={() => {
                  handleDetailedManualEntry({ content: voiceTranscription });
                  setVoiceTranscription('');
                }}
                disabled={isProcessing}
                className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isProcessing ? 'Processing...' : 'Submit Entry'}
              </button>
            </div>
          )}
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
