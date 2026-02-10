/**
 * Level View — Global Level Badge & XP Bar
 *
 * Displays the player's global level calculated from the root
 * "progression" stat, a progress bar toward the next level,
 * and the top 3 contributor nodes by experience.
 *
 * @module features/statistics/components/level-view
 */

import React, { useMemo } from 'react';
import { Trophy, TrendingUp, Star } from 'lucide-react';
import type { PlayerStatistics } from '@systems/progression';
import {
  PROGRESSION_ROOT_ID,
  getLevelForExp,
  getExpProgress,
  getExpForLevel,
} from '@systems/progression';

interface LevelViewProps {
  playerStatistics: PlayerStatistics;
  totalExp: number;
}

/**
 * Levels tab — global level badge + XP bar + top contributors.
 */
export const LevelView: React.FC<LevelViewProps> = ({
  playerStatistics,
  totalExp,
}) => {
  /** Global level derived from total accumulated EXP. */
  const globalLevel = useMemo(() => getLevelForExp(totalExp), [totalExp]);
  const progress = useMemo(() => getExpProgress(totalExp), [totalExp]);
  const currentLevelExp = useMemo(() => getExpForLevel(globalLevel), [globalLevel]);
  const nextLevelExp = useMemo(() => getExpForLevel(globalLevel + 1), [globalLevel]);

  /** Top 3 nodes by EXP contribution. */
  const topContributors = useMemo(() => {
    return Object.entries(playerStatistics)
      .filter(([label]) => label !== PROGRESSION_ROOT_ID)
      .map(([label, stats]) => ({
        label,
        experience: stats.experience,
        level: stats.level,
      }))
      .sort((a, b) => b.experience - a.experience)
      .slice(0, 3);
  }, [playerStatistics]);

  return (
    <div className="space-y-8">
      {/* ── Global Level Badge ── */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 flex flex-col items-center text-center">
        <div className="p-5 bg-amber-50 rounded-2xl mb-5">
          <Trophy className="w-10 h-10 text-amber-500" />
        </div>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
          Global Level
        </h3>
        <p className="text-7xl font-black text-slate-900 tracking-tighter mb-1">
          {globalLevel}
        </p>
        <p className="text-xs font-bold text-slate-400">
          {totalExp.toFixed(1)} total XP
        </p>
      </section>

      {/* ── XP Progress Bar ── */}
      <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-violet-50 rounded-xl">
            <TrendingUp className="w-5 h-5 text-violet-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Level Progress
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              Level {globalLevel} → Level {globalLevel + 1}
            </p>
          </div>
        </div>

        <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-indigo-500 rounded-full transition-all duration-700"
            style={{ width: `${Math.min(progress * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[11px] font-bold text-slate-400">
          <span>{currentLevelExp.toFixed(1)} XP</span>
          <span>{(progress * 100).toFixed(1)}%</span>
          <span>{nextLevelExp.toFixed(1)} XP</span>
        </div>
      </section>

      {/* ── Top Contributors ── */}
      {topContributors.length > 0 && (
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-xl">
              <Star className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Top Contributors
            </h3>
          </div>
          <ul className="space-y-3">
            {topContributors.map((node, i) => (
              <li
                key={node.label}
                className="flex items-center gap-4 py-3 border-b border-slate-100 last:border-0"
              >
                <span className="w-8 h-8 flex items-center justify-center bg-slate-100 text-slate-600 text-sm font-black rounded-xl">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700 truncate">
                    {node.label}
                  </p>
                  <p className="text-[10px] font-bold text-slate-400">
                    Level {node.level}
                  </p>
                </div>
                <span className="text-sm font-black text-indigo-600">
                  {node.experience.toFixed(1)} XP
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
