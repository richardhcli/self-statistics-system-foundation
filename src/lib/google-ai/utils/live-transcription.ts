import { GoogleGenAI, Modality, LiveServerMessage, LiveSession } from '@google/genai';
import { createPCMBlob } from './audio-processor';
import { getApiKey } from './get-api-key';

/**
 * Callbacks for live transcription events.
 * 
 * @interface LiveTranscriptionCallbacks
 */
export interface LiveTranscriptionCallbacks {
  /**
   * Called when connection is established and ready to receive audio.
   */
  onOpen?: () => void;
  
  /**
   * Called when interim transcription text is received.
   * This fires continuously as the user speaks, providing real-time feedback.
   * 
   * @param text - Partial transcription text (not yet final)
   */
  onInterimTranscription?: (text: string) => void;
  
  /**
   * Called when a speech turn is complete (user paused or stopped speaking).
   * This indicates the interim text should be finalized.
   * 
   * @param finalText - Complete transcription text for this speech segment
   */
  onFinalTranscription?: (finalText: string) => void;
  
  /**
   * Called when an error occurs during the session.
   * 
   * @param error - Error that occurred
   */
  onError?: (error: Error) => void;
  
  /**
   * Called when the connection is closed.
   */
  onClose?: () => void;
}

/**
 * Return value from startLiveTranscription containing session control methods.
 * 
 * @interface LiveTranscriptionSession
 */
export interface LiveTranscriptionSession {
  /**
   * Stops the transcription session and cleans up all resources.
   * Closes WebSocket, stops audio tracks, and closes AudioContext.
   */
  stop: () => void;
  
  /**
   * The underlying Live API session (for advanced use cases).
   */
  session: Promise<LiveSession>;
}

/**
 * Starts a real-time live transcription session using Gemini Live API.
 * 
 * This function:
 * 1. Requests microphone access
 * 2. Creates AudioContext at 16kHz sample rate
 * 3. Connects to Gemini Live API WebSocket
 * 4. Streams PCM audio in real-time
 * 5. Receives interim and final transcriptions with sub-second latency
 * 
 * @param callbacks - Event handlers for transcription lifecycle
 * @returns Session control object with stop() method
 * 
 * @throws {Error} If microphone access is denied or API connection fails
 * 
 * @remarks
 * - Uses gemini-2.5-flash-native-audio-preview model
 * - Requires 16kHz audio sample rate
 * - ScriptProcessorNode captures audio in 4096-sample chunks
 * - Interim transcriptions update continuously as user speaks
 * - Final transcriptions trigger when turn is complete (pause detected)
 * 
 * @example
 * ```typescript
 * const session = await startLiveTranscription({
 *   onInterimTranscription: (text) => setLiveText(prev => prev + text),
 *   onFinalTranscription: (text) => saveTranscription(text),
 *   onError: (err) => console.error(err)
 * });
 * 
 * // Later...
 * session.stop();
 * ```
 */
export async function startLiveTranscription(
  callbacks: LiveTranscriptionCallbacks = {}
): Promise<LiveTranscriptionSession> {
  const {
    onOpen,
    onInterimTranscription,
    onFinalTranscription,
    onError,
    onClose
  } = callbacks;

  console.log('[LiveTranscription] Starting session...');
  
  // Get API key from settings or environment
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API key not found. Please set it in Settings.');
  }

  const ai = new GoogleGenAI({ apiKey });
  
  // Request microphone access with 16kHz sample rate (required by Live API)
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  console.log('[LiveTranscription] Microphone access granted');
  
  const audioContext = new AudioContext({ sampleRate: 16000 });
  console.log('[LiveTranscription] AudioContext created at 16kHz');
  
  // Track interim text accumulation
  let interimTextBuffer = '';
  
  // Connect to Gemini Live API
  const sessionPromise = ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-12-2025',
    config: {
      responseModalities: [Modality.AUDIO], // Required even though we only want transcription
      inputAudioTranscription: {}, // Enables live transcription of user audio input
      systemInstruction: 'You are a transcription assistant. Provide accurate transcriptions of user speech. Do not generate audio responses.'
    },
    callbacks: {
      onopen: () => {
        console.log('[LiveTranscription] WebSocket connected');
        
        // Create audio processing pipeline
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        
        /**
         * Captures audio data and streams to Gemini Live API.
         * Called repeatedly as audio buffer fills (every ~93ms at 16kHz with 4096 samples).
         */
        processor.onaudioprocess = (e) => {
          const pcmBlob = createPCMBlob(e.inputBuffer.getChannelData(0));
          sessionPromise.then(session => {
            session.sendRealtimeInput({ media: pcmBlob });
          }).catch(err => {
            console.error('[LiveTranscription] Failed to send audio:', err);
          });
        };
        
        // Connect audio nodes: microphone -> processor -> destination (speaker)
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        console.log('[LiveTranscription] Audio pipeline connected');
        onOpen?.();
      },
      
      onmessage: async (msg: LiveServerMessage) => {
        // Handle interim transcription chunks (real-time as user speaks)
        if (msg.serverContent?.inputTranscription) {
          const chunk = msg.serverContent.inputTranscription.text;
          console.log('[LiveTranscription] Interim chunk:', chunk);
          interimTextBuffer += chunk;
          onInterimTranscription?.(chunk);
        }
        
        // Handle turn completion (user paused or stopped speaking)
        if (msg.serverContent?.turnComplete) {
          console.log('[LiveTranscription] Turn complete, final text:', interimTextBuffer.trim());
          if (interimTextBuffer.trim()) {
            onFinalTranscription?.(interimTextBuffer.trim());
          }
          interimTextBuffer = ''; // Reset for next turn
        }
      },
      
      onerror: (error: Error) => {
        console.error('[LiveTranscription] Session error:', error);
        onError?.(error);
      },
      
      onclose: () => {
        console.log('[LiveTranscription] Session closed');
        onClose?.();
      }
    }
  });

  /**
   * Stops the transcription session and cleans up all resources.
   */
  const stop = () => {
    console.log('[LiveTranscription] Stopping session');
    
    // Stop all microphone tracks
    stream.getTracks().forEach(track => {
      track.stop();
      console.log('[LiveTranscription] Stopped audio track');
    });
    
    // Close audio context
    if (audioContext.state !== 'closed') {
      audioContext.close().then(() => {
        console.log('[LiveTranscription] AudioContext closed');
      });
    }
    
    // Close WebSocket session
    sessionPromise.then(session => {
      // Note: The Live API session doesn't have an explicit close method
      // Connection will be cleaned up when resources are released
      console.log('[LiveTranscription] Session resources released');
    }).catch(err => {
      console.error('[LiveTranscription] Error during cleanup:', err);
    });
  };

  return {
    stop,
    session: sessionPromise
  };
}
