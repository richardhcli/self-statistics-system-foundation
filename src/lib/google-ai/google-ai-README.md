# Google AI Library

Pure AI integration layer for semantic analysis and information extraction.

## Overview

`lib/google-ai` provides **pure AI-powered utilities** for transforming unstructured journal text into structured semantic data. This library handles all interactions with the Gemini API and owns the prompt engineering for human characterization tasks.

## Key Responsibilities

1. **Text-to-Data Extraction Pipeline**  
   Raw journal entry → AI analysis → Structured semantic data
   - Extract actions (what the user did)
   - Estimate duration (how long it took)
   - Assign action weights (relative effort distribution)
   - Map to skills (trainable competencies)
   - Map to characteristics (high-level human attributes)
   - Generate generalization chains (abstraction hierarchies)

2. **AI Instance Management**  
   Configure and provide authenticated Gemini AI client instances

3. **Prompt Engineering**  
   Design and maintain specialized prompts for consistent semantic extraction

## Architecture

### Design Philosophy

- **Pure Utilities**: No imports from `@/stores` or React hooks
- **Data-In, Data-Out**: All functions accept text, return structured data
- **Timeout Protection**: All AI calls wrapped with timeout handlers
- **Graceful Degradation**: Returns safe defaults on AI failures
- **Type Safety**: Strong TypeScript contracts for AI responses

### Integration with soulTopology

This library provides the **raw semantic extraction**; `lib/soulTopology` transforms that data into topology fragments:

```
Journal Entry
    ↓
[google-ai] Extract semantic data
    ↓
TextToActionResponse { actions, skills, characteristics, duration }
    ↓
[soulTopology] Transform to topology
    ↓
GraphState { nodes, edges }
```

## Public API

### Core Utilities

#### `processTextToLocalTopologySinglePrompt(text: string)`
**Single-prompt orchestrator** - Extracts complete semantic decomposition in one API call.

**Returns**: `TextToActionResponse`
```typescript
{
  duration: string;              // "30 mins", "2 hours"
  weightedActions: Array<{       // Relative effort distribution
    label: string;               // "Debugging", "Writing"
    weight: number;              // 0.1-1.0, sum = 1.0
  }>;                            
  skillMappings: Array<{         // NEW: Explicit action→skill connections
    child: string;               // Action label
    parent: string;              // Skill label
    weight: number;              // Proportion of skill (0.1-1.0)
  }>;
  characteristicMappings: Array<{  // NEW: Explicit skill→characteristic connections
    child: string;               // Skill label
    parent: string;              // Characteristic label
    weight: number;              // Proportion of characteristic (0.1-1.0)
  }>;
  generalizationChain: Array<{   // Abstraction hierarchy
    child: string;               
    parent: string;              
    weight: number;              // Proportion of parent
  }>;                            
}
```

**Key Structure Changes** (2026-02-02):
- Duration now returned as integer minutes (`durationMinutes: 90`)
- `skillMappings` replaced `skills: string[]` - explicit action→skill connections
- `characteristicMappings` replaced `characteristics: string[]` - explicit skill→characteristic connections
- Every parent-child relationship now has an explicit weight for precise graph construction

**Use Case**: Primary entry processing path for AI-enabled journal entries

#### `generalizeConcept(actions, skills, characteristics)`
**Concept generalization** - Builds vertical abstraction hierarchy from concrete to abstract.

**Returns**: Generalization chain terminating at "progression" root concept

**Use Case**: Fallback when single-prompt doesn't return a generalization chain

#### `startLiveTranscription(callbacks)`
**Real-time streaming transcription** - Connects to Gemini Live API for sub-second latency audio-to-text.

Uses WebSocket streaming with continuous audio upload at 16kHz PCM format. Returns both interim (live) and final (confirmed) transcriptions.

**Parameters**: `LiveTranscriptionCallbacks`
```typescript
{
  onOpen?: () => void;                           // WebSocket connected
  onInterimTranscription?: (text: string) => void;  // Live text as user speaks
  onFinalTranscription?: (text: string) => void;    // Confirmed text when turn completes
  onError?: (error: Error) => void;              // Connection/API errors
  onClose?: () => void;                          // Session ended
}
```

**Returns**: `LiveTranscriptionSession`
```typescript
{
  stop: () => void;                              // Stop session, cleanup resources
  session: Promise<LiveSession>;                 // Underlying Live API session
}
```

**Example Usage**:
```typescript
const session = await startLiveTranscription({
  onInterimTranscription: (text) => {
    // Display live text as user speaks (sub-second latency)
    setLiveText(prev => prev + text);
  },
  onFinalTranscription: (finalText) => {
    // Speech turn completed (pause detected)
    saveTranscription(finalText);
  },
  onError: (err) => console.error(err)
});

// Later, stop session
session.stop();
```

**Key Features**:
- **True real-time**: Sub-second latency, streams as user speaks
- **Interim + Final**: Live preview text + confirmed segments
- **WebSocket-based**: Persistent connection, continuous audio streaming
- **16kHz PCM audio**: ScriptProcessorNode captures and converts audio
- **Automatic pause detection**: Fires final transcription when user stops speaking

**Technical Details**:
- Model: `gemini-2.5-flash-native-audio-preview-12-2025`
- Audio format: 16kHz PCM (Int16)
- Buffer size: 4096 samples (~93ms per chunk)
- Requires microphone permissions

#### `createPCMBlob(audioData: Float32Array)`
**Audio format converter** - Converts Float32 audio to PCM Blob for Live API.

Scales Float32 values (-1.0 to 1.0) to Int16 range (-32768 to 32767) and encodes as base64.

**Returns**: `Blob` with `mimeType: 'audio/pcm;rate=16000'`

**Use Case**: Used internally by `startLiveTranscription` to format audio chunks for streaming

### Prompt Chain Utilities (Legacy)

Multi-step extraction utilities (retained for debugging/comparison):
- `extractActions()` - Action extraction only
- `estimateTimeAndProportions()` - Duration + weights
- `actionToSkills()` - Action→Skill mapping
- `skillsToCharacteristic()` - Skill→Characteristic mapping

⚠️ **Prefer `processTextToLocalTopologySinglePrompt`** for production (fewer API calls, faster, cheaper)

## Configuration

### Prompt Templates

Located in `config/`:
- **`stuffed-prompt.ts`**: Single-prompt template with complete pipeline instructions
- **`prompts.ts`**: Individual prompt templates for chain processing

### API Client

Managed via:
- `getApiKey()` - Retrieves Gemini API key from secure storage
- `getAiInstance()` - Returns configured AI client with authentication

## Error Handling

All AI calls implement:
1. **Timeout Protection**: 30s default timeout prevents hanging
2. **Graceful Fallbacks**: Returns safe defaults on failure
3. **Detailed Logging**: Console warnings with error context

Example failure response:
```typescript
{
  duration: 'unknown',
  weightedActions: [],
  skills: [],
  characteristics: []
}
```

## Testing Implications

Pure utilities enable isolated testing:
```typescript
// Mock AI response for testing
const mockAnalysis = await processTextToLocalTopologySinglePrompt("test entry");
expect(mockAnalysis.weightedActions).toBeDefined();
```

## Dependencies

- `@google/genai` - Official Gemini SDK
- `@/types` - Shared type definitions (GraphState, TextToActionResponse)
- No dependencies on `@/stores` or React (pure utilities)

## Future Enhancements

- [ ] Response validation and sanitization
- [ ] Prompt A/B testing framework
- [ ] Caching layer for repeated entries
- [ ] Multi-language support
- [ ] Fine-tuned model integration
- [ ] Streaming audio transcription with Web Audio API
