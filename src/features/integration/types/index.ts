
/**
 * Types for the Integration feature.
 * Manages external Webhook configurations and event logs.
 */

export interface IntegrationLog {
  id: string;
  timestamp: string;
  eventName: string;
  payload: any;
  status: 'pending' | 'success' | 'error';
  response?: string;
}

export interface IntegrationConfig {
  webhookUrl: string;
  enabled: boolean;
  secret?: string;
}

export interface ObsidianConfig {
  enabled: boolean;
  host: string;
  port: string;
  apiKey: string;
  useHttps: boolean;
  targetFolder: string; // e.g., "Journal/AI-Entries"
}

export interface IntegrationStore {
  config: IntegrationConfig;
  obsidianConfig: ObsidianConfig;
  logs: IntegrationLog[];
}
