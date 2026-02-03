
/**
 * Represents a single transcription segment from a user turn.
 */
export interface TranscriptionSegment {
  id: string;
  text: string;
  timestamp: Date;
  isUser: boolean;
}

/**
 * Possible connection states for the live session.
 */
export enum ConnectionStatus {
  IDLE = 'IDLE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  ERROR = 'ERROR'
}
