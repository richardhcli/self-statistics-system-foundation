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
 * AI Settings stored in users/{uid}/account_config/ai_settings
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
 * UI Preferences stored in users/{uid}/account_config/ui_preferences
 */
export interface UIPreferences {
  theme: "light" | "dark";
  language: string;
  showCumulativeExp: boolean;
  showMasteryLevels: boolean;
  showRecentAction: boolean;
  animateProgressBars: boolean;
}

/**
 * Privacy settings stored in users/{uid}/account_config/privacy
 */
export interface PrivacySettings {
  encryptionEnabled: boolean;
  visibilityMode: "private" | "team" | "public";
  biometricUnlock: boolean;
}

/**
 * Notification settings stored in users/{uid}/account_config/notifications
 */
export interface NotificationSettings {
  pushEnabled: boolean;
  weeklySummaryEnabled: boolean;
  instantFeedbackEnabled: boolean;
}

/**
 * Integration settings stored in users/{uid}/account_config/integrations
 */
export interface IntegrationSettings {
  obsidianEnabled: boolean;
  webhookUrl: string;
  webhookEnabled: boolean;
}

/**
 * Billing settings stored in users/{uid}/account_config/billing_settings
 */
export interface BillingSettings {
  plan: "free" | "pro" | "enterprise";
  status: "active" | "paused" | "past_due" | "canceled" | "cancelled";
  nextBillingDate?: Timestamp | FieldValue;
}

/**
 * Union type for all account config types
 */
export type AccountConfigType =
  | "ai_settings"
  | "ui_preferences"
  | "privacy"
  | "notifications"
  | "integrations"
  | "billing_settings";

/**
 * Profile display settings stored in users/{uid}/user_information/profile_display
 */
export interface ProfileDisplaySettings {
  class: string;
}

/**
 * User statistics stored in users/{uid}/user_information/statistics
 */
export interface UserStatistics {
  totalEntries: number;
  longestStreak: number;
  lastEntryDate?: Timestamp;
}

/**
 * User achievements stored in users/{uid}/user_information/achievements
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
