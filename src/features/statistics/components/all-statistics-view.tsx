import React from 'react';
import { ListChecks } from 'lucide-react';

interface AllStatisticsViewProps {
  totalExp: number;
  totalLevels: number;
  highestExpNode: { label: string; experience: number } | null;
  highestLevelNode: { label: string; level: number } | null;
  totalNodes: number;
  totalEdges: number;
}

/**
 * All statistics tab view in a summary list format.
 */
export const AllStatisticsView: React.FC<AllStatisticsViewProps> = ({
  totalExp,
  totalLevels,
  highestExpNode,
  highestLevelNode,
  totalNodes,
  totalEdges,
}) => {
  const maxExpLabel = highestExpNode?.label ?? 'None';
  const maxExpValue = highestExpNode ? highestExpNode.experience.toFixed(1) : '0.0';
  const maxLevelLabel = highestLevelNode?.label ?? 'None';
  const maxLevelValue = highestLevelNode ? String(highestLevelNode.level) : 'Null';

  const rows = [
    { label: 'Total Experience', value: totalExp.toFixed(1) },
    { label: 'Total Levels', value: String(totalLevels) },
    { label: 'Max Experience', value: `${maxExpValue} (${maxExpLabel})` },
    { label: 'Max Level', value: `${maxLevelValue} (${maxLevelLabel})` },
    { label: 'Total Node Count', value: String(totalNodes) },
    { label: 'Total Edge Count', value: String(totalEdges) },
  ];

  return (
    <section className="bg-white rounded-3xl border border-slate-200 shadow-sm">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-3">
        <ListChecks className="w-5 h-5 text-slate-500" />
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">All Statistics</h3>
      </div>
      <ul className="divide-y divide-slate-100">
        {rows.map((row) => (
          <li key={row.label} className="flex items-center justify-between px-6 py-4">
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{row.label}</span>
            <span className="text-sm font-black text-slate-900">{row.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
};
