
// Main feature component (self-contained)
export { default as JournalFeature } from './components/journal-feature';

// Individual components (for granular access if needed)
export { default as JournalView } from './components/journal-view';
export { default as VoiceRecorder } from './components/voice-recorder/voice-recorder';
export { default as ManualEntryForm } from './components/manual-entry-form';

// Utils and API
export * from './utils/journal-entry-utils';
export * from './utils/time-utils';
export * from './hooks/create-entry';
export * from './api/get-journal';
export * from './api/update-journal';

// Types
export * from './types';


