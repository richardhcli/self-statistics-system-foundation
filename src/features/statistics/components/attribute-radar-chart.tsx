/**
 * Attribute Radar Chart
 *
 * Renders a Recharts RadarChart for the 7 core attributes.
 * Displays level as the radial value, normalized against the max observed level.
 *
 * @module features/statistics/components/attribute-radar-chart
 */

import React from 'react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

export interface RadarDataPoint {
  attribute: string;
  level: number;
  experience: number;
}

interface AttributeRadarChartProps {
  data: RadarDataPoint[];
}

/** Custom tooltip renderer for the radar chart. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const renderRadarTooltip = (props: any) => {
  const { active, payload } = props;
  if (!active || !payload?.[0]) return null;
  const data = payload[0].payload as RadarDataPoint;
  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-sm text-xs font-bold">
      <p className="text-slate-700">{data.attribute}</p>
      <p className="text-indigo-600">Lvl {data.level} · {data.experience.toFixed(1)} XP</p>
    </div>
  );
};

/**
 * 7-axis radar chart for core attribute visualization.
 * Falls back to a flat polygon when all values are 0.
 */
export const AttributeRadarChart: React.FC<AttributeRadarChartProps> = ({ data }) => {
  const maxLevel = Math.max(...data.map((d) => d.level), 1);

  return (
    <ResponsiveContainer width="100%" height={320}>
      <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="attribute"
          tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }}
        />
        <PolarRadiusAxis
          angle={90}
          domain={[0, maxLevel]}
          tick={false}
          axisLine={false}
        />
        <Radar
          name="Level"
          dataKey="level"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
          strokeWidth={2}
        />
        <Tooltip content={renderRadarTooltip} />
      </RadarChart>
    </ResponsiveContainer>
  );
};
