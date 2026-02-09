/**
 * Firestore CRUD utilities.
 * Centralized helpers for direct document and collection operations.
 */

import {
  arrayRemove,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  writeBatch,
} from "firebase/firestore";
import { db } from "./services";

const splitPath = (path: string): string[] =>
  path
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

const getDocRef = (path: string) => {
  const segments = splitPath(path);
  if (segments.length % 2 !== 0) {
    throw new Error(`Invalid document path: ${path}`);
  }
  const pathSegments = segments as [string, ...string[]];
  return doc(db, ...pathSegments);
};

const getCollectionRef = (path: string) => {
  const segments = splitPath(path);
  if (segments.length % 2 !== 1) {
    throw new Error(`Invalid collection path: ${path}`);
  }
  const pathSegments = segments as [string, ...string[]];
  return collection(db, ...pathSegments);
};

/**
 * Fetch a Firestore document by path.
 * Returns null when the document does not exist.
 */
export const getFirestoreDocument = async (
  path: string
): Promise<Record<string, unknown> | null> => {
  const snapshot = await getDoc(getDocRef(path));
  if (!snapshot.exists()) {
    return null;
  }
  return snapshot.data() as Record<string, unknown>;
};

/**
 * Fetch all documents in a collection as a map keyed by document ID.
 */
export const getFirestoreCollection = async (
  path: string
): Promise<Record<string, Record<string, unknown>>> => {
  const snapshot = await getDocs(getCollectionRef(path));
  const results: Record<string, Record<string, unknown>> = {};
  snapshot.forEach((docSnapshot) => {
    results[docSnapshot.id] = docSnapshot.data() as Record<string, unknown>;
  });
  return results;
};

/**
 * Delete a Firestore document by path.
 */
export const deleteFirestoreDocument = async (path: string): Promise<void> => {
  await deleteDoc(getDocRef(path));
};

/**
 * Delete a field within a Firestore document.
 */
export const deleteFirestoreField = async (
  docPath: string,
  fieldPath: string
): Promise<void> => {
  await updateDoc(getDocRef(docPath), {
    [fieldPath]: deleteField(),
  });
};

/**
 * Remove a value from an array field within a Firestore document.
 */
export const removeFirestoreArrayValue = async (
  docPath: string,
  fieldPath: string,
  value: unknown
): Promise<void> => {
  await updateDoc(getDocRef(docPath), {
    [fieldPath]: arrayRemove(value),
  });
};

/**
 * Delete every document in a collection path.
 */
export const deleteFirestoreCollection = async (path: string): Promise<void> => {
  const snapshot = await getDocs(getCollectionRef(path));
  const docs = snapshot.docs;
  const batchSize = 400;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = writeBatch(db);
    docs.slice(i, i + batchSize).forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
    });
    await batch.commit();
  }
};
