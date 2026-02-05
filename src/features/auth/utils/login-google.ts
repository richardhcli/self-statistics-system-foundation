/**
 * Utility function to handle Google Sign-In using Firebase Authentication.
 * Also ensures a Firestore user profile document exists.
 */

import { signInWithPopup } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

/**
 * Signs the user in with Google and initializes their Firestore profile
 * if it does not already exist.
 */
export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    const userRef = doc(db, "users", user.uid);
    const existing = await getDoc(userRef);

    if (!existing.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName ?? "",
        email: user.email ?? "",
        photoURL: user.photoURL ?? "",
        createdAt: serverTimestamp(),
      });
    }

    return user;
  } catch (error) {
    console.error("Error during Google Sign-In", error);
    throw error;
  }
};