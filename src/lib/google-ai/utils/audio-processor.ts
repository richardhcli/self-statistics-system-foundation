import { Blob } from '@google/genai';

/**
 * Encodes a Uint8Array into a base64 string.
 * 
 * @param bytes - The byte array to encode
 * @returns Base64 encoded string
 * 
 * @example
 * ```typescript
 * const bytes = new Uint8Array([72, 101, 108, 108, 111]);
 * const encoded = encode(bytes); // "SGVsbG8="
 * ```
 */
export function encode(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Converts float audio data from the microphone into a PCM Blob for the Gemini Live API.
 * 
 * Float32 audio data is converted to Int16 PCM format at 16kHz sample rate,
 * which is the required format for the Gemini Live API's real-time audio input.
 * 
 * @param data - Raw Float32Array audio data from AudioContext (values typically -1.0 to 1.0)
 * @returns Blob object formatted for Gemini API (audio/pcm;rate=16000)
 * 
 * @remarks
 * - Float values are scaled by 32768 to convert to Int16 range (-32768 to 32767)
 * - Sample rate must be 16kHz for Live API compatibility
 * - Used by ScriptProcessorNode.onaudioprocess callback
 * 
 * @example
 * ```typescript
 * processor.onaudioprocess = (e) => {
 *   const pcmBlob = createPCMBlob(e.inputBuffer.getChannelData(0));
 *   session.sendRealtimeInput({ media: pcmBlob });
 * };
 * ```
 */
export function createPCMBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  
  // Convert float audio (-1.0 to 1.0) to int16 PCM (-32768 to 32767)
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
