
# Gemini Live Transcription Applet

This application demonstrates the high-performance speech-to-text capabilities of the **Gemini 2.5 Flash Native Audio** model using the Live API.

## Technical Architecture

### 1. Audio Pipeline
- **Capture**: Uses the Browser's `MediaDevices.getUserMedia` to access the microphone.
- **Processing**: The raw audio is sampled at **16,000 Hz** (16kHz). 
- **Encoding**: `ScriptProcessorNode` captures raw Float32 data, which is converted to **Int16 PCM** and base64-encoded to match the Gemini Live API's requirements.
- **Transmission**: Data is streamed in real-time via a persistent WebSocket connection.

### 2. Transcription Logic
- **`inputAudioTranscription`**: This feature of the Live API is enabled in the configuration. It allows the model to return text transcripts of the user's speech *without* necessarily requiring a text or audio response from the model itself.
- **Interim vs. Final**: 
  - `serverContent.inputTranscription`: Provides a continuous stream of "interim" text as the user speaks.
  - `serverContent.turnComplete`: Signals that a pause has been detected and the current segment of speech is finished.

### 3. Modular React Structure
- **`App.tsx`**: The orchestrator.
- **`useTranscription.ts`**: A custom hook managing the complex state transitions and socket lifecycle.
- **`components/`**: Atomic UI components for Header, Transcription Feed, and Footer.
- **`utils/audio-processor.ts`**: Pure utility functions for binary data manipulation.

## How to use
1. Ensure your `API_KEY` is set in the environment.
2. Click **"Start Session"**.
3. Grant microphone permissions.
4. Speak naturally; the text will appear with sub-second latency.
