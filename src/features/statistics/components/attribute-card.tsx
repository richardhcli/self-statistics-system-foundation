/**
 * Attribute Card
 *
 * Single card displaying one core attribute's level and EXP progress.
 * Uses Lucide icons mapped from ATTRIBUTE_ICONS constant.
 *
 * @module features/statistics/components/attribute-card
 */

import React from 'react';
import {
  Heart,
  Brain,
  Eye,
  Users,
  Shield,
  Sparkles,
  Crown,
} from 'lucide-react';
import type { CoreAttribute } from '@systems/progression';
import { ATTRIBUTE_ICONS, ATTRIBUTE_DESCRIPTIONS } from '@systems/progression';
import { getExpProgress } from '@systems/progression';

/** Map icon name → Lucide component. */
const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Heart,
  Brain,
  Eye,
  Users,
  Shield,
  Sparkles,
  Crown,
};

interface AttributeCardProps {
  attribute: CoreAttribute;
  level: number;
  experience: number;
}

/**
 * Renders a single core attribute as a compact card with icon,
 * level badge, and progress bar toward the next level.
 */
export const AttributeCard: React.FC<AttributeCardProps> = ({
  attribute,
  level,
  experience,
}) => {
  const IconComponent = ICON_MAP[ATTRIBUTE_ICONS[attribute]] ?? Heart;
  const description = ATTRIBUTE_DESCRIPTIONS[attribute];
  const progress = getExpProgress(experience);
  const isEmpty = experience === 0;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all ${
        isEmpty
          ? 'bg-slate-50 border-slate-100 opacity-50'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`p-2 rounded-xl ${
            isEmpty ? 'bg-slate-100' : 'bg-indigo-50'
          }`}
        >
          <IconComponent
            className={`w-5 h-5 ${
              isEmpty ? 'text-slate-300' : 'text-indigo-600'
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider truncate">
            {attribute}
          </h4>
          <p className="text-[10px] text-slate-400 font-semibold truncate">
            {description}
          </p>
        </div>
        <span className="text-sm font-black text-indigo-600">
          Lvl {level}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-indigo-500 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(progress * 100, 100)}%` }}
        />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[9px] font-bold text-slate-400">
          {experience.toFixed(1)} XP
        </span>
        <span className="text-[9px] font-bold text-slate-400">
          {(progress * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
};
