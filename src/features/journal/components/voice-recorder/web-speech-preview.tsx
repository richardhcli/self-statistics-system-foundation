import React, { useRef, useEffect, useState } from 'react';

/**
 * Web Speech API Preview Component
 * 
 * Provides a display-only real-time preview of voice input using the Web Speech API.
 * This is NOT used for official transcription - it's purely for user feedback.
 * The official transcription comes from Gemini batch transcription.
 * 
 * Gracefully falls back to silent mode if Web Speech API is unavailable.
 * 
 * @component
 * @param {Object} props
 * @param {boolean} props.isRecording - Whether recording is currently active
 * @param {(text: string) => void} props.onPreviewChange - Callback when preview text changes
 * @returns {JSX.Element} Preview box with real-time transcription feedback
 * 
 * @example
 * <WebSpeechPreview 
 *   isRecording={true}
 *   onPreviewChange={(text) => setPreviewText(text)}
 * />
 */
export const WebSpeechPreview: React.FC<{
  isRecording: boolean;
  onPreviewChange: (text: string) => void;
}> = ({ isRecording, onPreviewChange }) => {
  const webSpeechRef = useRef<any>(null);
  const [previewText, setPreviewText] = useState('');

  useEffect(() => {
    if (!isRecording) {
      // Stop Web Speech when not recording
      if (webSpeechRef.current) {
        try {
          webSpeechRef.current.stop();
          webSpeechRef.current = null;
        } catch (err) {
          console.error('[WebSpeechPreview] Error stopping:', err);
        }
      }
      return;
    }

    // Start Web Speech API
    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.log('[WebSpeechPreview] API unavailable - silent mode');
        setPreviewText('(Silent mode - no preview)');
        return;
      }

      webSpeechRef.current = new SpeechRecognition();
      webSpeechRef.current.continuous = true;
      webSpeechRef.current.interimResults = true;
      webSpeechRef.current.lang = 'en-US';

      let finalText = '';

      webSpeechRef.current.onstart = () => {
        console.log('[WebSpeechPreview] Started');
      };

      webSpeechRef.current.onresult = (event: any) => {
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;

          if (event.results[i].isFinal) {
            finalText += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        const preview = finalText + interimTranscript;
        setPreviewText(preview);
        onPreviewChange(finalText.trim());
      };

      webSpeechRef.current.onerror = (event: any) => {
        console.warn('[WebSpeechPreview] Error:', event.error);
      };

      webSpeechRef.current.start();
    } catch (err) {
      console.error('[WebSpeechPreview] Initialization failed:', err);
      setPreviewText('(Preview unavailable)');
    }

    return () => {
      if (webSpeechRef.current) {
        try {
          webSpeechRef.current.stop();
          webSpeechRef.current = null;
        } catch (err) {
          console.error('[WebSpeechPreview] Error stopping:', err);
        }
      }
    };
  }, [isRecording, onPreviewChange]);

  // Only show preview if recording
  if (!isRecording || !previewText) {
    return null;
  }

  return (
    <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <p className="text-sm text-slate-500 dark:text-slate-400 italic mb-2">Live preview (Web Speech API):</p>
      <p className="text-slate-400 dark:text-slate-500 italic">{previewText}</p>
    </div>
  );
};
