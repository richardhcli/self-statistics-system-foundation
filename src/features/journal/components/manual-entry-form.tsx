
import React, { useState } from 'react';
import { Type, Hourglass, Send, Loader2 } from 'lucide-react';
import { ManualEntryFormProps } from '../types';

/**
 * ManualEntryForm Component
 * 
 * Journal entry form for manual text input.
 * AI classification is always enabled; no manual action tagging is provided.
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
 * @param {ManualEntryFormProps} props - Component props
 * @returns {JSX.Element} Manual entry form with voice integration
 */
const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ 
  onSubmit, 
  isProcessing, 
  initialText = '',
  onTextChange 
}) => {
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
   * Handles form submission with AI classification always enabled
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    onSubmit({
      content,
      duration: duration || undefined,
    });

    // Reset form
    setContent('');
    setDuration('');
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
