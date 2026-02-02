import React from 'react';
import { Send } from 'lucide-react';

/**
 * Props for TextOnlyManualEntryForm component.
 * 
 * @property {string} value - Current textarea value
 * @property {(value: string) => void} onChange - Change handler for text input
 * @property {() => void} onSubmit - Submit handler for the form
 * @property {boolean} isSubmitDisabled - Disables submit button when true
 */
interface TextOnlyManualEntryFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSubmitDisabled: boolean;
}

/**
 * TextOnlyManualEntryForm Component
 * 
 * Inline, text-only journal entry form used in the JournalView day expansion.
 * This form intentionally does not support AI toggles or manual action tags.
 * 
 * @param {TextOnlyManualEntryFormProps} props - Component props
 * @returns {JSX.Element} Inline text-only manual entry form
 */
const TextOnlyManualEntryForm: React.FC<TextOnlyManualEntryFormProps> = ({
  value,
  onChange,
  onSubmit,
  isSubmitDisabled,
}) => {
  return (
    <div className="px-6 py-2 relative">
      <textarea
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="What did you just finish doing?"
        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 resize-none min-h-[80px]"
      />
      <button
        onClick={onSubmit}
        disabled={isSubmitDisabled}
        className="absolute bottom-6 right-8 p-2 bg-indigo-600 text-white rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Send className="w-3 h-3" />
      </button>
    </div>
  );
};

export default TextOnlyManualEntryForm;
