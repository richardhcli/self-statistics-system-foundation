
import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, LiveServerMessage } from '@google/genai';
import { ConnectionStatus, TranscriptionSegment } from '../types';
import { createBlob } from '../utils/audio-processor';

/**
 * Hook to manage Gemini Live transcription session.
 */
export function useTranscription() {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.IDLE);
  const [history, setHistory] = useState<TranscriptionSegment[]>([]);
  const [interimText, setInterimText] = useState('');
  
  const audioCtxRef = useRef<AudioContext | null>(null);

  const start = useCallback(async () => {
    try {
      setStatus(ConnectionStatus.CONNECTING);
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Initialize Audio Context for microphone capture
      audioCtxRef.current = new AudioContext({ sampleRate: 16000 });
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO], // Mandatory modality
          inputAudioTranscription: {}, // Enables live transcription of user audio
          systemInstruction: 'You are a silent observer. Provide transcriptions but do not generate audio responses.'
        },
        callbacks: {
          onopen: () => {
            setStatus(ConnectionStatus.ACTIVE);
            const source = audioCtxRef.current!.createMediaStreamSource(stream);
            const processor = audioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const pcmBlob = createBlob(e.inputBuffer.getChannelData(0));
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            
            source.connect(processor);
            processor.connect(audioCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Live transcription chunks
            if (msg.serverContent?.inputTranscription) {
              setInterimText(prev => prev + msg.serverContent!.inputTranscription!.text);
            }
            // End of a speech turn
            if (msg.serverContent?.turnComplete) {
              setInterimText(current => {
                if (current.trim()) {
                  setHistory(h => [...h, { 
                    id: crypto.randomUUID(), 
                    text: current.trim(), 
                    timestamp: new Date(), 
                    isUser: true 
                  }]);
                }
                return '';
              });
            }
          },
          onerror: () => setStatus(ConnectionStatus.ERROR),
          onclose: () => setStatus(ConnectionStatus.IDLE)
        }
      });
    } catch (e) {
      console.error(e);
      setStatus(ConnectionStatus.ERROR);
    }
  }, []);

  const stop = useCallback(() => {
    // Refreshing is the most reliable way to kill all hardware/socket resources in this env
    window.location.reload();
  }, []);

  return { status, history, interimText, start, stop };
}
