/**
 * Utility function to handle Google Sign-In using Firebase Authentication.
 * Synchronizes user profile with Firestore on successful authentication.
 */

import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { syncUserProfile } from "@/lib/firebase/user-profile";

/**
 * Signs the user in with Google and syncs their profile with Firestore.
 * On first login: creates user document and default account_config.
 * On subsequent logins: updates only changed profile fields (smart sync).
 *
 * @returns Firebase User object
 * @throws Error if authentication fails
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Sync user profile with Firestore (handles both first-time and returning users)
    await syncUserProfile(user);

    return user;
  } catch (error) {
    console.error("Error during Google Sign-In", error);
    throw error;
  }
};