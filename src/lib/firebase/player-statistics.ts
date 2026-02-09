/**
 * Firebase player statistics service layer.
 * Implements read-aside access patterns for player statistics.
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./services";
import type { PlayerStatistics } from "@/stores/player-statistics";
import type { PlayerStatisticsDoc } from "@/types/firestore";

const buildDefaultStats = (): PlayerStatistics => ({
  progression: { experience: 0, level: 1 },
});

/**
 * Loads player statistics for a user.
 *
 * @param uid - User ID
 * @returns Player statistics map
 */
export const loadPlayerStatistics = async (uid: string): Promise<PlayerStatistics> => {
  const statsRef = doc(db, "users", uid, "user_information", "player_statistics");
  const snapshot = await getDoc(statsRef);

  if (!snapshot.exists()) {
    const defaults = buildDefaultStats();
    await setDoc(statsRef, { stats: defaults } satisfies PlayerStatisticsDoc);
    return defaults;
  }

  const data = snapshot.data() as PlayerStatisticsDoc;
  return data.stats ?? buildDefaultStats();
};

/**
 * Updates player statistics for a user.
 *
 * @param uid - User ID
 * @param stats - Player statistics map
 */
export const updatePlayerStatistics = async (
  uid: string,
  stats: PlayerStatistics
): Promise<void> => {
  const statsRef = doc(db, "users", uid, "user_information", "player_statistics");
  await setDoc(statsRef, { stats } satisfies PlayerStatisticsDoc, { merge: true });
};
