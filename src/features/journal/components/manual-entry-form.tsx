
import React, { useState, useRef } from 'react';
import { Type, Hourglass, Send, Loader2 } from 'lucide-react';
import { ManualEntryFormProps } from '../types';
import { useJournalEntryPipeline } from '../hooks/use-journal-entry-pipeline';

/**
 * ManualEntryForm Component
 * 
 * Journal entry form for manual text input using the unified entry pipeline.
 * 
 * **Progressive Pipeline Integration:**
 * Uses three-stage entry creation internally:
 * 1. Creates draft entry with user's actual text
 * 2. Content already filled (Stage 2 skipped internally)
 * 3. Triggers AI analysis immediately in background
 * 
 * **Hybrid Strategy:**
 * - Draft entry display suppressed by parent (initialText already filled)
 * - Unified pipeline runs internally (user sees immediate confirmation)
 * - AI analysis completes in background (user continues using app)
 * 
 * **Voice Integration:**
 * - Can receive initial text from voice "To Text" button
 * - User can edit transcribed text before submitting
 * - Voice auto-submit bypasses this form entirely
 * 
 * Fields:
 * - Content: Raw text entry (pre-populated if from voice "To Text")
 * - Time Taken: Optional duration override
 * 
 * **Flow:**
 * 1. User types or pastes text
 * 2. User optionally adds duration
 * 3. User clicks "Submit Entry"
 * 4. Pipeline Stage 1: Create draft with user's text + duration
 * 5. Pipeline Stage 3: Trigger AI analysis immediately
 * 6. Parent's onSubmit callback called for integration events
 * 
 * @param {ManualEntryFormProps} props - Component props
 * @returns {JSX.Element} Manual entry form with unified pipeline integration
 */
const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ 
  onSubmit, 
  isProcessing, 
  initialText = ''
}) => {
  const { processManualEntry } = useJournalEntryPipeline();
  const [content, setContent] = useState(initialText);
  const [duration, setDuration] = useState('');

  /**
   * Handles textarea content changes.
   */
  const handleContentChange = (value: string) => {
    setContent(value);
  };

  // Track last appended transcription to avoid duplicates
  const lastAppendedRef = useRef<string | null>(null);

  /**
   * Append transcribed text from voice "To Text" button.
   * 
   * **Behavior:**
   * - If textarea is empty, set the transcription as content
   * - If textarea has existing text, append transcription to the end
   * - Track last appended text to avoid re-appending duplicate text
   * 
   * This allows user to build up entry text from multiple recordings
   * or combine voice transcription with manual editing.
   */
  React.useEffect(() => {
    if (initialText && initialText !== lastAppendedRef.current) {
      setContent(prev => {
        // If there's existing content, append with a space
        // Otherwise just set the transcribed text
        const updated = prev.trim() ? `${prev} ${initialText}` : initialText;
        lastAppendedRef.current = initialText;
        return updated;
      });
    }
  }, [initialText]);

  /**
   * Handles form submission using unified progressive pipeline.
   * 
  * **Stage 1:** Create draft entry with user's text + duration
  * **Stage 2:** Skipped internally (content already finalized)
  * **Stage 3:** Trigger AI analysis immediately
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      await processManualEntry(content, { duration: duration || undefined, useAI: true });

      // Call parent's onSubmit callback for integration events
      onSubmit({
        content,
        duration: duration || undefined,
      });

      // Reset form
      setContent('');
      setDuration('');
    } catch (error) {
      console.error('[ManualEntryForm] Pipeline submission failed:', error);
      alert('Failed to submit entry. Please try again.');
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-6 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
          <Type className="w-4 h-4" />
        </div>
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Manual Input</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="Write your entry here... (or use 'To Text' from voice recorder)"
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none min-h-[120px] transition-all"
          />
        </div>

        <div className="space-y-1">
          <label className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-tight ml-1">
            <Hourglass className="w-3 h-3" /> Time Taken (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. 45 mins"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            type="submit"
            disabled={isProcessing || !content.trim()}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Entry
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ManualEntryForm;
