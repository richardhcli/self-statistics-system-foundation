/**
 * Firebase journal service layer.
 * Implements read-aside access patterns for journal data.
 */

import {
  collection,
  doc,
  FieldPath,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "./services";

/**
 * Allowed lifecycle states for a journal entry.
 */
export type JournalEntryStatus =
  | "DRAFT"
  | "TRANSCRIBING"
  | "PENDING_ANALYSIS"
  | "ANALYZING"
  | "COMPLETED"
  | "ANALYSIS_FAILED";

/**
 * AI analysis result for a processed journal entry.
 */
export interface JournalEntryResult {
  totalExpIncrease: number;
  nodeIncreases: Record<string, number>;
  levelsGained: number;
}

/**
 * Entry metadata that is safe for display and sync.
 */
export interface JournalEntryMetadata {
  flags: {
    aiAnalyzed: boolean;
  };
  timePosted: string;
  duration?: number;
}

/**
 * Normalized journal entry stored in Firebase and cached in Zustand.
 */
export interface JournalEntryData {
  id: string;
  content: string;
  status: JournalEntryStatus;
  actions: Record<string, number>;
  result?: JournalEntryResult;
  metadata: JournalEntryMetadata;
}

/**
 * Day-level tree node referencing entry IDs only.
 */
export interface JournalTreeDay {
  totalExp: number;
  entries: string[];
}

/**
 * Month-level tree node containing day summaries.
 */
export interface JournalTreeMonth {
  totalExp: number;
  days: Record<string, JournalTreeDay>;
}

/**
 * Year-level tree node containing month summaries.
 */
export interface JournalTreeYear {
  totalExp: number;
  months: Record<string, JournalTreeMonth>;
}

/**
 * Top-level tree structure keyed by year (YYYY).
 */
export type JournalTreeStructure = Record<string, JournalTreeYear>;

const buildMonthRange = (year: string, month: string) => {
  const normalizedMonth = String(parseInt(month, 10)).padStart(2, "0");
  const monthNumber = parseInt(normalizedMonth, 10);
  const yearNumber = parseInt(year, 10);

  const nextMonth = monthNumber === 12 ? 1 : monthNumber + 1;
  const nextYear = monthNumber === 12 ? yearNumber + 1 : yearNumber;

  const start = `${yearNumber}${normalizedMonth}00-000000-`;
  const end = `${nextYear}${String(nextMonth).padStart(2, "0")}00-000000-`;

  return { start, end };
};

/**
 * Subscribe to the journal tree structure document.
 *
 * @param uid User ID
 * @param onUpdate Callback invoked with the tree structure
 * @param onError Optional error handler
 * @returns Unsubscribe function
 */
export const subscribeToTree = (
  uid: string,
  onUpdate: (tree: JournalTreeStructure) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const treeRef = doc(db, "users", uid, "journal_meta", "tree_structure");

  return onSnapshot(
    treeRef,
    (snapshot) => {
      const data = snapshot.data();
      onUpdate((data ?? {}) as JournalTreeStructure);
    },
    (error) => {
      if (onError) {
        onError(error);
      }
    }
  );
};

/**
 * Fetch all entries for a given month using the document ID prefix range.
 *
 * @param uid User ID
 * @param year Four-digit year (YYYY)
 * @param month Month number (1-12 or 01-12)
 */
export const fetchMonthEntries = async (
  uid: string,
  year: string,
  month: string
): Promise<JournalEntryData[]> => {
  const { start, end } = buildMonthRange(year, month);
  const entriesRef = collection(db, "users", uid, "journal_entries");

  const entriesQuery = query(
    entriesRef,
    where(FieldPath.documentId(), ">=", start),
    where(FieldPath.documentId(), "<", end)
  );

  const snapshot = await getDocs(entriesQuery);
  return snapshot.docs.map((entry) => entry.data() as JournalEntryData);
};

/**
 * Create a journal entry and update the tree structure in a single batch.
 *
 * @param uid User ID
 * @param entry Normalized journal entry data
 * @param treeUpdate Partial tree structure update payload
 */
export const createEntryBatch = async (
  uid: string,
  entry: JournalEntryData,
  treeUpdate: Partial<JournalTreeStructure>
): Promise<void> => {
  const batch = writeBatch(db);
  const entryRef = doc(db, "users", uid, "journal_entries", entry.id);
  const treeRef = doc(db, "users", uid, "journal_meta", "tree_structure");

  batch.set(entryRef, entry, { merge: true });
  batch.set(treeRef, treeUpdate, { merge: true });

  await batch.commit();
};

/**
 * Merge updates into the tree structure document.
 *
 * @param uid User ID
 * @param treeUpdate Partial tree structure update payload
 */
export const updateJournalTree = async (
  uid: string,
  treeUpdate: Partial<JournalTreeStructure>
): Promise<void> => {
  const treeRef = doc(db, "users", uid, "journal_meta", "tree_structure");
  await setDoc(treeRef, treeUpdate, { merge: true });
};
