/**
 * Firestore data types for user profiles, account configuration, and user information.
 * These types mirror the Firestore schema structure.
 */

import type { FieldValue, Timestamp } from "firebase/firestore";

/**
 * User profile document stored in users/{uid}
 */
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt: Timestamp | FieldValue;
  lastUpdated: Timestamp | FieldValue;
}

/**
 * AI Settings stored in users/{uid}/account-config/ai-settings
 */
export interface AISettings {
  provider: "gemini" | "openai";
  model: {
    voiceTranscriptionModel: string;
    abstractionModel: string;
  };
  temperature: number;
  maxTokens: number;
}

/**
 * UI Preferences stored in users/{uid}/account-config/ui-preferences
 */
export interface UIPreferences {
  theme: "light" | "dark";
  language: string;
  notifications: boolean;
}

/**
 * Integration settings stored in users/{uid}/account-config/integrations
 */
export interface IntegrationSettings {
  obsidianEnabled: boolean;
  webhookUrl: string;
  webhookEnabled: boolean;
}

/**
 * Billing settings stored in users/{uid}/account-config/billing-settings
 */
export interface BillingSettings {
  plan: "free" | "pro" | "enterprise";
  status: "active" | "paused" | "cancelled";
  nextBillingDate?: Timestamp | FieldValue;
}

/**
 * Union type for all account config types
 */
export type AccountConfigType = "ai-settings" | "ui-preferences" | "integrations" | "billing-settings";

/**
 * User statistics stored in users/{uid}/user-information/statistics
 */
export interface UserStatistics {
  totalEntries: number;
  longestStreak: number;
  lastEntryDate?: Timestamp;
}

/**
 * User achievements stored in users/{uid}/user-information/achievements
 */
export interface UserAchievements {
  badges: string[];
  milestones: string[];
}

/**
 * Account status stored in users/{uid}/admin-config/account-status (admin only)
 */
export interface AccountStatus {
  role: "user" | "developer" | "admin";
  status: "active" | "suspended" | "deleted";
  lastLogin?: Timestamp;
}
