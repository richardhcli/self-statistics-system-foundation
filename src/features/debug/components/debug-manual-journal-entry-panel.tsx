import React, { useState } from "react";
import { useJournalEntryPipeline } from "@/features/journal/hooks/use-journal-entry-pipeline";
import DebuggingManualJournalEntryForm from "./debugging-manual-journal-entry-form";

/**
 * DebugManualJournalEntryPanel
 * 
 * Manual journal entry testing panel for the debug feature.
 * Routed under /app/debug/manual-journal-entry.
 * 
 * Responsibilities:
 * - Provide direct entry creation with optional AI processing
 * - Show processing state during submission
 * 
 * @returns JSX.Element
 */
const DebugManualJournalEntryPanel: React.FC = () => {
  const [isDebugEntryProcessing, setIsDebugEntryProcessing] = useState(false);
  const { processManualEntry } = useJournalEntryPipeline();

  /**
   * Handles debug manual journal entries with direct action tags.
   * Supports both AI and manual action pipelines for testing.
   * 
   * @param payload - Manual entry data submitted from debug form
   */
  const handleDebugManualEntry = async (payload: {
    content: string;
    time?: string;
    duration?: string;
    actions?: string[];
    useAI: boolean;
  }) => {
    setIsDebugEntryProcessing(true);
    try {
      await processManualEntry(payload.content, {
        actions: payload.actions,
        useAI: payload.useAI,
        duration: payload.duration,
      });
    } finally {
      setIsDebugEntryProcessing(false);
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-3xl mx-auto p-6">
        <DebuggingManualJournalEntryForm
          onSubmit={handleDebugManualEntry}
          isProcessing={isDebugEntryProcessing}
        />
      </div>
    </div>
  );
};

export default DebugManualJournalEntryPanel;
