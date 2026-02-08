import React, { useEffect, useState } from 'react';
import { useJournalEntryPipeline } from '@/features/journal/hooks/use-journal-entry-pipeline';
import { useJournalActions, useJournalEntries, useJournalTree } from '@/stores/journal';
import { JournalFeatureProps } from '../types';
import JournalView from './journal-view';
import ManualEntryForm from './manual-entry-form';
import VoiceRecorder from './voice-recorder/voice-recorder';
import { subscribeToTree } from '@/lib/firebase/journal';
import { useAuth } from '@/providers/auth-provider';

/**
 * JournalFeature - Main journal container with dual submission flows.
 * 
 * **Architecture:**
 * - Manages only ephemeral UI state (processing, textarea for voice "To Text" review)
 * - VoiceRecorder uses unified pipeline internally (no parent callbacks needed)
 * - ManualEntryForm uses unified pipeline internally (no parent callbacks needed)
 * - Parent keeps state minimal: only voiceTranscriptionText for "To Text" flow
 * 
 * **Data Flow:**
 * 1. VoiceRecorder auto-submit: Component handles all 3 pipeline stages internally
 * 2. VoiceRecorder "To Text": Calls onToTextReview callback, parent populates textarea
 * 3. ManualEntryForm submit: Component handles all 3 pipeline stages internally
 * 4. JournalView quick entry: Parent handles (optional, for inline quick add)
 * 5. JournalView re-parse: Parent handles (optional, for re-analyzing existing entry)
 * 
 * **Global State:**
 * - Reads journal data from global cache (useJournalEntries/useJournalTree)
 * - Writes entries via journalActions (optimisticAdd/updateEntry)
 * - Parent does NOT manage entry creation - delegated to pipeline hooks
 * 
 * **Integration Points:**
 * - onIntegrationEvent callback for webhooks/Obsidian sync
 * - Called after AI processing completes (for logging/tracking)
 * 
 * **Unified Progressive Pipeline:**
 * Both manual and voice use same 3-stage pipeline internally:
 * 1. Create dummy entry (immediate UI feedback)
 * 2. Update with content (transcribed or typed)
 * 3. Trigger AI analysis (background)
 * 
 * Hybrid strategy: Progressive internally, dummy display suppressed for manual.
 */

const JournalFeature: React.FC<JournalFeatureProps> = ({ onIntegrationEvent }) => {
  const entries = useJournalEntries();
  const tree = useJournalTree();
  const { setTree } = useJournalActions();
  const { processQuickLog, retryAnalysis } = useJournalEntryPipeline();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [voiceTranscriptionText, setVoiceTranscriptionText] = useState('');
  const [processingEntries, setProcessingEntries] = useState<Set<string>>(new Set());
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [isTreeReady, setIsTreeReady] = useState(false);

  useEffect(() => {
    if (!user?.uid) {
      setIsTreeReady(false);
      return;
    }

    setIsTreeReady(false);
    const unsubscribe = subscribeToTree(
      user.uid,
      (nextTree) => {
        setTree(nextTree);
        setIsTreeReady(true);
      },
      (error) => {
        console.warn('[JournalFeature] Tree subscription failed:', error);
        setIsTreeReady(true);
      }
    );

    return () => unsubscribe();
  }, [setTree, user?.uid]);

  /**
   * Handle "To Text" button from voice recorder.
   * Populates textarea with transcribed text for user review/editing.
   * User can now manually submit using ManualEntryForm.
   * 
   * **Pipeline:** 
   * No entry created yet. When user submits textarea, ManualEntryForm
   * will use unified pipeline (Stage 1 with actual user text + Stage 3 AI).
   * 
   * @param transcription - Complete transcribed text from Gemini
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
  const handleManualQuickEntry = async (content: string, date?: Date) => {
    if (!content.trim()) {
      return;
    }

    setIsProcessing(true);
    try { 
      await processQuickLog(content, date);
    } finally { 
      setIsProcessing(false); 
    }
  };

  /**
   * Handle detailed manual entry submission (from form).
   * 
   * **Pipeline (handled internally by ManualEntryForm):**
   * 1. Form creates dummy entry with user's typed text + duration
   * 2. Form triggers AI analysis immediately
   * 3. Parent's onIntegrationEvent callback fires for tracking
   * 
   * Parent just needs to:
   * - Call integration callback for logging/webhooks
   * - Clear the textarea after submission
   * - Set processing state (OPTIONAL - ManualEntryForm manages its own state)
   */
  const handleDetailedManualEntry = async (payload: {
    content: string;
    duration?: string;
  }) => {
    console.log('[JournalFeature] Manual entry submitted via form, triggering integration callback');
    
    // Call integration callback for logging/webhooks
    if (onIntegrationEvent) {
      await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
        originalText: payload.content,
        source: 'manual_detailed',
        duration: payload.duration,
      });
    }
    
    // Clear textarea
    setVoiceTranscriptionText('');
  };

  /**
   * Handle re-parsing an existing entry
   * Useful when user wants to re-analyze an entry with AI
   */
  const handleParseEntry = async (entryId: string) => {
    const entry = entries[entryId];
    if (!entry?.content) return;

    setIsProcessing(true);
    setProcessingEntries(prev => {
      const next = new Set(prev);
      next.add(entryId);
      return next;
    });
    try {
      await retryAnalysis(entryId);

      if (onIntegrationEvent) {
        await onIntegrationEvent('JOURNAL_AI_PROCESSED', {
          originalText: entry.content,
          source: 'reparse',
          entryId,
        });
      }
    } finally {
      setIsProcessing(false);
      setProcessingEntries(prev => {
        const next = new Set(prev);
        next.delete(entryId);
        return next;
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 lg:items-start">
      {/* Left Sidebar - Input Controls */}
      <div className="lg:col-span-1 lg:sticky lg:top-24 lg:self-start">
        <div className="space-y-6">
          {/* Voice Recorder Card - Dual submission flows */}
          <VoiceRecorder 
            onToTextReview={handleVoiceToTextReview}
            onProcessingStateChange={(entryId, isProcessing) => {
              setProcessingEntries(prev => {
                const next = new Set(prev);
                if (isProcessing) {
                  next.add(entryId);
                } else {
                  next.delete(entryId);
                }
                return next;
              });
            }}
          />
          
          {/* Manual Entry Form - Includes textarea for voice review */}
          <ManualEntryForm 
            onSubmit={handleDetailedManualEntry} 
            isProcessing={isProcessing}
            initialText={voiceTranscriptionText}
            onProcessingStateChange={(entryId, isProcessing) => {
              setProcessingEntries(prev => {
                const next = new Set(prev);
                if (isProcessing) {
                  next.add(entryId);
                } else {
                  next.delete(entryId);
                }
                return next;
              });
            }}
          />
        </div>
      </div>

      {/* Right Content - Journal View */}
      <div className="lg:col-span-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
        <JournalView 
          tree={tree}
          entries={entries}
          isTreeReady={isTreeReady}
          onAddManualEntry={handleManualQuickEntry}
          onParseEntry={handleParseEntry}
          processingEntries={processingEntries}
          feedbackMessage={feedbackMessage}
        />
      </div>
    </div>
  );
};

export default JournalFeature;
