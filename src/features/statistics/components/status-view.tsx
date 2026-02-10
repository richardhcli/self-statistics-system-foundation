/**
 * Status View — Core Attribute Dashboard
 *
 * Displays the player's 7 archetypal attributes via radar chart and
 * attribute cards, plus recent neural-impact entries and skill clusters.
 *
 * @module features/statistics/components/status-view
 */

import React, { useMemo } from 'react';
import { Zap, Activity } from 'lucide-react';
import type { NodeData, EdgeData } from '@/stores/cdag-topology/types';
import type { PlayerStatistics } from '@systems/progression';
import type { JournalEntryData } from '@/stores/journal/types';
import {
  CORE_ATTRIBUTES,
  getLevelForExp,
} from '@systems/progression';
import { AttributeRadarChart } from './attribute-radar-chart';
import type { RadarDataPoint } from './attribute-radar-chart';
import { AttributeCard } from './attribute-card';
import { groupSkillsByCharacteristic } from '../utils/group-skills';

interface StatusViewProps {
  totalExp: number;
  playerStatistics: PlayerStatistics;
  nodes: Record<string, NodeData>;
  edges: Record<string, EdgeData>;
  entries: Record<string, JournalEntryData>;
}

/**
 * Status tab — RPG attribute dashboard.
 *
 * Sections:
 * 1. Radar chart for the 7 core attributes
 * 2. Attribute grid cards with level + progress bar
 * 3. Recent Neural Impact (last 5 entries with EXP)
 * 4. Skill Clusters grouped by characteristic
 */
export const StatusView: React.FC<StatusViewProps> = ({
  totalExp,
  playerStatistics,
  nodes,
  edges,
  entries,
}) => {
  /** Build radar data from characteristic nodes matching CORE_ATTRIBUTES. */
  const radarData: RadarDataPoint[] = useMemo(() => {
    return CORE_ATTRIBUTES.map((attr) => {
      const stats = playerStatistics[attr] ?? { experience: 0, level: 0 };
      return {
        attribute: attr,
        level: stats.level,
        experience: stats.experience,
      };
    });
  }, [playerStatistics]);

  /** Resolved attribute stats for the card grid. */
  const attributeStats = useMemo(() => {
    return CORE_ATTRIBUTES.map((attr) => {
      const stats = playerStatistics[attr] ?? { experience: 0, level: 0 };
      return { attribute: attr, level: stats.level, experience: stats.experience };
    });
  }, [playerStatistics]);

  /** Recent entries sorted by time, limited to 5 with EXP results. */
  const recentGains = useMemo(() => {
    return Object.values(entries)
      .filter((e) => e.result && e.result.totalExpIncrease > 0)
      .sort((a, b) => b.metadata.timePosted.localeCompare(a.metadata.timePosted))
      .slice(0, 5);
  }, [entries]);

  /** Skill clusters grouped by governing characteristic. */
  const clusters = useMemo(() => {
    return groupSkillsByCharacteristic(nodes, edges, playerStatistics);
  }, [nodes, edges, playerStatistics]);

  return (
    <div className="space-y-8">
      {/* ── Section 1: Radar Chart ── */}
      <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-indigo-50 rounded-xl">
            <Activity className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">
              Attribute Overview
            </h3>
            <p className="text-xs text-slate-400 font-semibold">
              {totalExp.toFixed(1)} total XP across all nodes
            </p>
          </div>
        </div>
        <AttributeRadarChart data={radarData} />
      </section>

      {/* ── Section 2: Attribute Grid ── */}
      <section>
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
          Core Attributes
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {attributeStats.map((a) => (
            <AttributeCard
              key={a.attribute}
              attribute={a.attribute}
              level={a.level}
              experience={a.experience}
            />
          ))}
        </div>
      </section>

      {/* ── Section 3: Recent Neural Impact ── */}
      {recentGains.length > 0 && (
        <section className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            Recent Neural Impact
          </h3>
          <ul className="space-y-3">
            {recentGains.map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-slate-100 last:border-0"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">
                    {entry.content.slice(0, 60)}
                    {entry.content.length > 60 ? '…' : ''}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold">
                    {new Date(entry.metadata.timePosted).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-700 text-xs font-black rounded-lg whitespace-nowrap">
                  <Zap className="w-3 h-3" />
                  +{entry.result!.totalExpIncrease.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Section 4: Skill Clusters ── */}
      {clusters.length > 0 && (
        <section>
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
            Skill Clusters
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {clusters.map((cluster) => (
              <div
                key={cluster.characteristicId}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">
                    {cluster.characteristicLabel}
                  </h4>
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                    {cluster.totalExp.toFixed(1)} XP
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {cluster.skills.map((skill) => (
                    <li
                      key={skill.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span className="text-slate-600 font-semibold truncate">
                        {skill.label}
                      </span>
                      <span className="text-slate-400 font-bold whitespace-nowrap ml-2">
                        Lvl {skill.level} · {skill.experience.toFixed(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
