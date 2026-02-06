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
  IntegrationSettings,
  BillingSettings,
  AccountConfigType,
} from "@/types/firestore";

/**
 * Syncs user profile with Firestore, only updating changed fields.
 * On first login, creates user document and default account-config subcollection.
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

    // Create default account-config subcollection
    await createDefaultAccountConfig(user.uid);
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
 * Creates default account configuration subcollection on first login.
 * Initializes AI settings, UI preferences, integrations, and billing settings.
 *
 * @param uid - User ID
 * @throws Error if Firestore operation fails
 */
const createDefaultAccountConfig = async (uid: string): Promise<void> => {
  const configRef = collection(db, "users", uid, "account-config");

  // AI Settings
  await setDoc(doc(configRef, "ai-settings"), {
    provider: "gemini",
    model: {
      voiceTranscriptionModel: "gemini-2-flash",
      abstractionModel: "gemini-3-flash",
    },
    temperature: 0,
    maxTokens: 2048,
  } as AISettings);

  // UI Preferences
  await setDoc(doc(configRef, "ui-preferences"), {
    theme: "dark",
    language: "en",
    notifications: true,
  } as UIPreferences);

  // Integrations
  await setDoc(doc(configRef, "integrations"), {
    obsidianEnabled: false,
    webhookUrl: "",
    webhookEnabled: false,
  } as IntegrationSettings);

  // Billing Settings
  await setDoc(doc(configRef, "billing-settings"), {
    plan: "free",
    status: "active",
  } as BillingSettings);
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
  const configRef = doc(db, "users", uid, "account-config", configType);
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
  const configRef = doc(db, "users", uid, "account-config", configType);
  await updateDoc(configRef, updates as Record<string, any>);
};

/**
 * Loads AI settings for a user.
 *
 * @param uid - User ID
 * @returns AI settings configuration
 */
export const loadAISettings = async (uid: string): Promise<AISettings> => {
  return loadAccountConfig<AISettings>(uid, "ai-settings");
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
  return updateAccountConfig(uid, "ai-settings", updates);
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
  return loadAccountConfig<UIPreferences>(uid, "ui-preferences");
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
  return updateAccountConfig(uid, "ui-preferences", updates);
};
