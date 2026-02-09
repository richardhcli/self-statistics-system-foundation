/**
 * Firebase user profile synchronization and management utilities.
 * Handles Firestore integration for user data, account configuration, and settings.
 */

import { User } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./services";
import type {
  UserProfile,
  AISettings,
  UIPreferences,
  PrivacySettings,
  NotificationSettings,
  IntegrationSettings,
  BillingSettings,
  AccountConfigType,
  ProfileDisplaySettings,
} from "@/types/firestore";

/**
 * Syncs user profile with Firestore, only updating changed fields.
 * On first login, creates user document and default account_config subcollection.
 * On subsequent logins, updates only changed fields (smart sync).
 *
 * @param user - Firebase User object from authentication
 * @throws Error if Firestore operation fails
 */
export const syncUserProfile = async (user: User): Promise<void> => {
  const userRef = doc(db, "users", user.uid);
  const existing = await getDoc(userRef);

  if (!existing.exists()) {
    // First login - create full profile + default config
    await setDoc(userRef, {
      uid: user.uid,
      displayName: user.displayName ?? "",
      email: user.email ?? "",
      photoURL: user.photoURL ?? "",
      createdAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
    });

    // Create default account_config subcollection
    await createDefaultAccountConfig(user.uid);
    await createDefaultUserInformation(user.uid);
  } else {
    // Check for changes and update only modified fields
    const existingData = existing.data() as Partial<UserProfile>;
    const updates: Partial<UserProfile> = {};

    if (existingData.displayName !== user.displayName) {
      updates.displayName = user.displayName ?? "";
    }
    if (existingData.email !== user.email) {
      updates.email = user.email ?? "";
    }
    if (existingData.photoURL !== user.photoURL) {
      updates.photoURL = user.photoURL ?? "";
    }

    // Only write if there are changes
    if (Object.keys(updates).length > 0) {
      updates.lastUpdated = serverTimestamp();
      await updateDoc(userRef, updates);
    }
  }
};

/**
 * Creates default account_config subcollection on first login.
 * Initializes AI settings, UI preferences, integrations, and billing settings.
 *
 * @param uid - User ID
 * @throws Error if Firestore operation fails
 */
const createDefaultAccountConfig = async (uid: string): Promise<void> => {
  const configRef = collection(db, "users", uid, "account_config");

  // AI Settings
  await setDoc(doc(configRef, "ai_settings"), {
    provider: "gemini",
    model: {
      voiceTranscriptionModel: "gemini-2-flash",
      abstractionModel: "gemini-3-flash",
    },
    temperature: 0,
    maxTokens: 2048,
  } as AISettings);

  // UI Preferences
  await setDoc(doc(configRef, "ui_preferences"), {
    theme: "dark",
    language: "en",
    showCumulativeExp: true,
    showMasteryLevels: true,
    showRecentAction: true,
    animateProgressBars: true,
  } as UIPreferences);

  // Privacy Settings
  await setDoc(doc(configRef, "privacy"), {
    encryptionEnabled: true,
    visibilityMode: "private",
    biometricUnlock: false,
  } as PrivacySettings);

  // Notification Settings
  await setDoc(doc(configRef, "notifications"), {
    pushEnabled: true,
    weeklySummaryEnabled: true,
    instantFeedbackEnabled: true,
  } as NotificationSettings);

  // Integrations
  await setDoc(doc(configRef, "integrations"), {
    obsidianEnabled: false,
    webhookUrl: "",
    webhookEnabled: false,
  } as IntegrationSettings);

  // Billing Settings
  await setDoc(doc(configRef, "billing_settings"), {
    plan: "free",
    status: "active",
  } as BillingSettings);
};

const createDefaultUserInformation = async (uid: string): Promise<void> => {
  const profileDisplayRef = doc(db, "users", uid, "user_information", "profile_display");
  await setDoc(profileDisplayRef, {
    class: "",
  } as ProfileDisplaySettings);
};

/**
 * Loads complete user profile from Firestore.
 *
 * @param uid - User ID
 * @returns User profile document
 * @throws Error if user profile not found
 */
export const loadUserProfile = async (uid: string): Promise<UserProfile> => {
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    throw new Error("User profile not found");
  }

  return snapshot.data() as UserProfile;
};

/**
 * Updates user profile fields.
 *
 * @param uid - User ID
 * @param updates - Partial profile updates
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<UserProfile>
): Promise<void> => {
  const userRef = doc(db, "users", uid);
  await updateDoc(userRef, {
    ...updates,
    lastUpdated: serverTimestamp(),
  } as Record<string, any>);
};

/**
 * Loads account configuration of a specific type from Firestore.
 *
 * @template T - The account config type
 * @param uid - User ID
 * @param configType - Type of configuration to load
 * @returns Configuration object
 * @throws Error if config not found
 */
export const loadAccountConfig = async <T>(
  uid: string,
  configType: AccountConfigType
): Promise<T> => {
  const configRef = doc(db, "users", uid, "account_config", configType);
  const snapshot = await getDoc(configRef);

  if (!snapshot.exists()) {
    throw new Error(`Config ${configType} not found`);
  }

  return snapshot.data() as T;
};

/**
 * Updates account configuration of a specific type.
 *
 * @template T - The account config type
 * @param uid - User ID
 * @param configType - Type of configuration to update
 * @param updates - Partial configuration object with fields to update
 * @throws Error if Firestore operation fails
 */
export const updateAccountConfig = async <T>(
  uid: string,
  configType: AccountConfigType,
  updates: Partial<T>
): Promise<void> => {
  const configRef = doc(db, "users", uid, "account_config", configType);
  await setDoc(configRef, updates as Record<string, any>, { merge: true });
};

/**
 * Loads AI settings for a user.
 *
 * @param uid - User ID
 * @returns AI settings configuration
 */
export const loadAISettings = async (uid: string): Promise<AISettings> => {
  return loadAccountConfig<AISettings>(uid, "ai_settings");
};

/**
 * Updates AI settings for a user.
 *
 * @param uid - User ID
 * @param updates - Partial AI settings to update
 */
export const updateAISettings = async (
  uid: string,
  updates: Partial<AISettings>
): Promise<void> => {
  return updateAccountConfig(uid, "ai_settings", updates);
};

/**
 * Loads UI preferences for a user.
 *
 * @param uid - User ID
 * @returns UI preferences configuration
 */
export const loadUIPreferences = async (
  uid: string
): Promise<UIPreferences> => {
  return loadAccountConfig<UIPreferences>(uid, "ui_preferences");
};

/**
 * Updates UI preferences for a user.
 *
 * @param uid - User ID
 * @param updates - Partial UI preferences to update
 */
export const updateUIPreferences = async (
  uid: string,
  updates: Partial<UIPreferences>
): Promise<void> => {
  return updateAccountConfig(uid, "ui_preferences", updates);
};

/**
 * Loads privacy settings for a user.
 *
 * @param uid - User ID
 * @returns Privacy settings configuration
 */
export const loadPrivacySettings = async (
  uid: string
): Promise<PrivacySettings> => {
  return loadAccountConfig<PrivacySettings>(uid, "privacy");
};

/**
 * Updates privacy settings for a user.
 *
 * @param uid - User ID
 * @param updates - Partial privacy settings to update
 */
export const updatePrivacySettings = async (
  uid: string,
  updates: Partial<PrivacySettings>
): Promise<void> => {
  return updateAccountConfig(uid, "privacy", updates);
};

/**
 * Loads notification settings for a user.
 *
 * @param uid - User ID
 * @returns Notification settings configuration
 */
export const loadNotificationSettings = async (
  uid: string
): Promise<NotificationSettings> => {
  return loadAccountConfig<NotificationSettings>(uid, "notifications");
};

/**
 * Updates notification settings for a user.
 *
 * @param uid - User ID
 * @param updates - Partial notification settings to update
 */
export const updateNotificationSettings = async (
  uid: string,
  updates: Partial<NotificationSettings>
): Promise<void> => {
  return updateAccountConfig(uid, "notifications", updates);
};

/**
 * Loads profile display settings for a user.
 *
 * @param uid - User ID
 * @returns Profile display settings
 */
export const loadProfileDisplay = async (
  uid: string
): Promise<ProfileDisplaySettings> => {
  const profileDisplayRef = doc(db, "users", uid, "user_information", "profile_display");
  const snapshot = await getDoc(profileDisplayRef);

  if (!snapshot.exists()) {
    throw new Error("Profile display not found");
  }

  return snapshot.data() as ProfileDisplaySettings;
};

/**
 * Updates profile display settings for a user.
 *
 * @param uid - User ID
 * @param updates - Partial profile display settings
 */
export const updateProfileDisplay = async (
  uid: string,
  updates: Partial<ProfileDisplaySettings>
): Promise<void> => {
  const profileDisplayRef = doc(db, "users", uid, "user_information", "profile_display");
  await setDoc(profileDisplayRef, updates as Record<string, any>, { merge: true });
};
