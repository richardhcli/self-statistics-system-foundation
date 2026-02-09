/**
 * Firebase guest data cleanup helpers.
 * Removes guest user documents and related subcollections.
 */

import {
  deleteFirestoreCollection,
  deleteFirestoreDocument,
} from "@/lib/firebase/firestore-crud";

/**
 * Deletes all known Firestore data for a guest user.
 *
 * @param uid - Guest user ID
 */
export const deleteGuestUserData = async (uid: string): Promise<void> => {
  const collectionsToDelete = [
    `users/${uid}/graphs/cdag_topology/nodes`,
    `users/${uid}/graphs/cdag_topology/edges`,
    `users/${uid}/journal_entries`,
    `users/${uid}/journal_meta`,
    `users/${uid}/account_config`,
    `users/${uid}/user_information`,
  ];

  for (const path of collectionsToDelete) {
    await deleteFirestoreCollection(path);
  }

  const docsToDelete = [
    `users/${uid}/graphs/cdag_topology`,
    `users/${uid}`,
  ];

  for (const path of docsToDelete) {
    await deleteFirestoreDocument(path);
  }
};
