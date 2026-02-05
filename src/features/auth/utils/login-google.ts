/**
 * Utility function to handle Google Sign-In using Firebase Authentication.
*/


import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    // The signed-in user info
    const user = result.user;
    return user;
  } catch (error) {
    console.error("Error during Google Sign-In", error);
    throw error;
  }
};