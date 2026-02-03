
import { Blob } from '@google/genai';

/**
 * Encodes a Uint8Array into a base64 string.
 * @param {Uint8Array} bytes - The byte array to encode.
 * @returns {string} The base64 encoded string.
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
 * @param {Float32Array} data - The raw float32 audio data from the microphone.
 * @returns {Blob} A Blob object formatted for the Gemini API (audio/pcm;rate=16000).
 */
export function createBlob(data: Float32Array): Blob {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}
