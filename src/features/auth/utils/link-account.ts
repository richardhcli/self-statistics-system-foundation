/**
 * Utility function to link an anonymous user to a Google account.
 * Promotes the guest session to a permanent identity.
 */

import { FirebaseError } from "firebase/app";
import {
  GoogleAuthProvider,
  deleteUser,
  linkWithPopup,
  signInWithCredential,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { deleteGuestUserData } from "@/lib/firebase/guest-cleanup";
import { resetLocalStateToInitial } from "@/stores/root/reset-local-state";

/**
 * Links the current anonymous user with Google via a popup.
 *
 * @returns Firebase UserCredential
 * @throws Error if there is no authenticated user
 */
export const linkAccountWithGoogle = async () => {
  if (!auth.currentUser) {
    throw new Error("No authenticated user to link");
  }

  if (!auth.currentUser.isAnonymous) {
    throw new Error("User is already linked to a provider");
  }

  const guestUser = auth.currentUser;

  try {
    return await linkWithPopup(guestUser, googleProvider);
  } catch (error) {
    if (!(error instanceof FirebaseError)) {
      throw error;
    }

    if (error.code !== "auth/credential-already-in-use") {
      throw error;
    }

    const credential = GoogleAuthProvider.credentialFromError(error);
    if (!credential) {
      throw error;
    }

    await deleteGuestUserData(guestUser.uid);
    await resetLocalStateToInitial();
    await deleteUser(guestUser);

    return await signInWithCredential(auth, credential);
  }
};
