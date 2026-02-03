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
 * JournalFeature - Voice recording with dual submission flows.
 * 
 * Responsibilities:
 * 1. Handle voice recording with two submission modes:
 *    - Auto-submit (Record button stops): Immediate entry creation
 *    - Manual review ("To Text" button): Populate textarea for editing
 * 2. Process entries with AI analysis
 * 3. Display journal entries with hierarchical view
 * 
 * Voice Recording Architecture:
 * - MediaRecorder captures WebM audio (max 60s or manual stop)
 * - Web Speech API provides display-only real-time preview
 * - Two submission flows: immediate entry creation OR textarea review
 * - No Live API streaming (batch Gemini transcription only)
 * 
 * Architecture:
 * - Uses global journal store (stores/journal) for persistent data
 * - Uses local useState for ephemeral UI state (processing, textarea)
 * - Handles all journal-related business logic internally
 * - Provides integration points for webhooks/external systems via callbacks
 */

const JournalFeature: React.FC<JournalFeatureProps> = ({ onIntegrationEvent }) => {
  const journal = useJournal();
  const journalActions = useJournalActions();
  const createJournalEntry = useCreateJournalEntry();
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscriptionText, setVoiceTranscriptionText] = useState('');

  /**
   * Handle auto-submit from Record button (immediate entry creation).
   * Called when user stops recording via Record button.
   * Immediately triggers useCreateJournalEntry with AI enabled.
   * 
   * @param {string} transcription - Complete transcribed text from Gemini
   */
  const handleVoiceAutoSubmit = async (transcription: string) => {
    if (!transcription.trim()) {
      console.log('[JournalFeature] Empty transcription, skipping submission');
      return;
    }

    console.log('[JournalFeature] Auto-submitting voice transcription:', transcription);
    setIsProcessing(true);
    
    try {
      await createJournalEntry({
        entry: transcription,
        useAI: true, // Always use AI for auto-submit voice entries
      });

      if (onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: transcription,
          source: 'voice_auto_submit',
        });
      }
      
      console.log('[JournalFeature] Voice entry submitted successfully');
    } catch (error) {
      console.error('[JournalFeature] Voice auto-submit failed:', error);
      alert('Failed to process voice entry. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle manual review from "To Text" button.
   * Called when user clicks "To Text" during recording.
   * Populates textarea with transcribed text for user review/editing.
   * User can manually submit after reviewing and editing.
   * 
   * @param {string} transcription - Complete transcribed text from Gemini
   */
  const handleVoiceToTextReview = (transcription: string) => {
    if (!transcription.trim()) {
      console.log('[JournalFeature] Empty transcription from To Text, skipping');
      return;
    }

    console.log('[JournalFeature] Populating textarea with voice transcription for review');
    setVoiceTranscriptionText(transcription);
    // Textarea is visible in ManualEntryForm, user can now edit and submit manually
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
        {/* Voice Recorder Card - Dual submission flows */}
        <div className="sticky top-24">
          <VoiceRecorder 
            onSubmitAuto={handleVoiceAutoSubmit}
            onToTextReview={handleVoiceToTextReview}
          />
        </div>
        
        {/* Manual Entry Form - Includes textarea for voice review */}
        <ManualEntryForm 
          onSubmit={handleDetailedManualEntry} 
          isProcessing={isProcessing}
          initialText={voiceTranscriptionText}
          onTextChange={setVoiceTranscriptionText}
        />
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
