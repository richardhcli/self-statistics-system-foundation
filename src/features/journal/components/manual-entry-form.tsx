
import React, { useState } from 'react';
import { Type, Hourglass, Send, Loader2 } from 'lucide-react';
import { ManualEntryFormProps } from '../types';
import { useCreateEntryPipeline } from '../hooks/create-entry/use-create-entry-pipeline';

/**
 * ManualEntryForm Component
 * 
 * Journal entry form for manual text input using unified progressive pipeline.
 * 
 * **Progressive Pipeline Integration:**
 * Uses three-stage entry creation internally:
 * 1. Creates dummy entry with user's actual text (isDummyContent=false)
 * 2. Content already filled (Stage 2 skipped internally)
 * 3. Triggers AI analysis immediately in background
 * 
 * **Hybrid Strategy:**
 * - Dummy entry display suppressed by parent (initialText already filled)
 * - Progressive pipeline runs internally (user sees immediate confirmation)
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
 * 4. Pipeline Stage 1: Create dummy with user's text + duration
 * 5. Pipeline Stage 3: Trigger AI analysis immediately
 * 6. Parent's onSubmit callback called for integration events
 * 
 * @param {ManualEntryFormProps} props - Component props
 * @returns {JSX.Element} Manual entry form with unified pipeline integration
 */
const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ 
  onSubmit, 
  isProcessing, 
  initialText = '',
  onTextChange 
}) => {
  const { createDummyEntry, updateWithAIAnalysis } = useCreateEntryPipeline();
  const [content, setContent] = useState(initialText);
  const [duration, setDuration] = useState('');

  /**
   * Handles textarea content changes.
   * Syncs with parent component for voice transcription flow.
   */
  const handleContentChange = (value: string) => {
    setContent(value);
    if (onTextChange) {
      onTextChange(value);
    }
  };

  /**
   * Sync with parent's initialText (from voice "To Text")
   */
  React.useEffect(() => {
    if (initialText) {
      setContent(initialText);
    }
  }, [initialText]);

  /**
   * Handles form submission using unified progressive pipeline.
   * 
   * **Stage 1:** Create dummy entry with user's text + duration
   * - Content already filled (no placeholder display)
   * - Duration stored in metadata for AI processing
   * 
   * **Stage 2:** Skipped internally (content already finalized)
   * 
   * **Stage 3:** Trigger AI analysis immediately
   * - AI processes entry in background
   * - User can continue interacting with app
   * - Results update in real-time when AI completes
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    try {
      // Stage 1: Create dummy entry with actual user text + duration
      // Note: isDummyContent=false by convention (actual text, not placeholder)
      const entryId = createDummyEntry(
        content,           // User's actual text (not placeholder)
        duration || undefined,
        undefined           // Let pipeline auto-generate date
      );

      // Stage 3: Trigger AI analysis immediately
      // Note: Stage 2 skipped (content already finalized)
      await updateWithAIAnalysis(entryId, content);

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
