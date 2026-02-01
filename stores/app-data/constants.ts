import { AppData } from './types';

export const INITIAL_APP_DATA: AppData = { 
  journal: {}, 
  visualGraph: { nodes: [], edges: [] }, 
  cdagTopology: {
    "progression": { parents: {}, type: 'characteristic' }
  }, 
  playerStatistics: {
    "progression": { experience: 0, level: 1 }
  },
  userInformation: { 
    name: 'Pioneer',
    userClass: 'Neural Architect',
    mostRecentAction: 'None'
  },
  integrations: {
    config: { webhookUrl: '', enabled: false },
    obsidianConfig: {
      enabled: false,
      host: '127.0.0.1',
      port: '27124',
      apiKey: '',
      useHttps: false,
      targetFolder: 'Journal/AI'
    },
    logs: []
  },
  aiConfig: {
    model: 'gemini-3-flash-preview',
    temperature: 0,
    liveTranscription: true,
    voiceSensitivity: 0.5
  }
};
