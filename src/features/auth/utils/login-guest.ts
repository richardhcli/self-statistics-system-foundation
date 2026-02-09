/**
 * Utility function to handle anonymous guest sign-in using Firebase Authentication.
 * Ensures the guest has a Firestore profile and default config to match read-aside flows.
 */

import { signInAnonymously } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/firebase/user-profile";

/**
 * Signs the user in anonymously and syncs a placeholder profile in Firestore.
 *
 * @returns Firebase User object
 * @throws Error if authentication fails
 */
export const loginAsGuest = async () => {
  try {
    const result = await signInAnonymously(auth);
    const user = result.user;

    // Create user profile + defaults so guest reads/writes follow the same pipeline.
    await syncUserProfile(user);

    return user;
  } catch (error) {
    console.error("Error during guest sign-in", error);
    throw error;
  }
};
