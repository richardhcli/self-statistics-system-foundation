
import React, { useMemo, useState } from 'react';
import { useJournalEntries, useJournalTree } from '@/stores/journal';
import { useGraphNodes } from '@/stores/cdag-topology';
import { usePlayerStatistics } from '@/stores/player-statistics';
import { useUserInformation } from '@/stores/user-information';
import { StatsHeader } from './stats-header';
import { StatsTable } from './stats-table';
import { AttributesGrid } from './attributes-grid';
import { MasteryList } from './mastery-list';
import { SystemStatus } from './system-status';
import { PlayerStatusTab } from './player-status-tab';
import { LayoutGrid, User, ArrowRightLeft } from 'lucide-react';

type TabType = 'player-status' | 'all-statistics';

const StatisticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('player-status');
  const entries = useJournalEntries();
  const tree = useJournalTree();
  const nodes = useGraphNodes();
  const playerStatistics = usePlayerStatistics();
  const userInformation = useUserInformation();

  const stats = useMemo(() => {
    let totalEntries = 0;
    let totalExp = 0;
    let totalLevels = 0;
    
    // Fix: Updated domain keys to match characterization categories from the AI pipeline
    const domainCounts: Record<string, number> = { 
      Intellect: 0, 
      Vitality: 0, 
      Social: 0, 
      Wisdom: 0, 
      Discipline: 0, 
      Creativity: 0, 
      Leadership: 0 
    };
    
    // Aggregation Logic for UI Stats
    Object.values(entries).forEach((entry) => {
      if (entry.content) totalEntries++;

      if (entry.result?.nodeIncreases) {
        Object.keys(entry.result.nodeIncreases).forEach((nodeId) => {
          const nodeData = nodes[nodeId];
          if (nodeData?.type === 'characteristic') {
            const match = Object.keys(domainCounts).find(
              (key) => key.toLowerCase() === nodeData.label.toLowerCase()
            );
            if (match) {
              domainCounts[match] = (domainCounts[match] || 0) + 1;
            }
          }
        });
      }
    });

    const playerLevel = Math.floor(totalEntries / 5) + 1;
    const playerExpProgress = (totalEntries % 5) * 20;

    // Use explicit casting to handle unknown property access from Object.entries on Record
    const nodesWithStats = Object.entries(playerStatistics).map(([label, s]) => {
      const nodeStats = s as any;
      totalExp += nodeStats.experience;
      totalLevels += nodeStats.level;
      return { label, ...nodeStats };
    });

    const sortedByExp = [...nodesWithStats].sort((a, b) => b.experience - a.experience);
    const sortedByLevel = [...nodesWithStats].sort((a, b) => b.level - a.level);

    // Calculate EXP Today and Yesterday from Metadata
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const toDateParts = (dateObj: Date) => ({
      year: dateObj.getFullYear().toString(),
      month: String(dateObj.getMonth() + 1).padStart(2, '0'),
      day: String(dateObj.getDate()).padStart(2, '0'),
    });

    const getDateMeta = (dateObj: Date) => {
      const { year, month, day } = toDateParts(dateObj);
      return tree[year]?.months?.[month]?.days?.[day]?.totalExp || 0;
    };

    const expToday = getDateMeta(now);
    const expYesterday = getDateMeta(yesterday);

    return { 
      totalEntries, 
      playerLevel, 
      playerExpProgress, 
      domains: domainCounts, 
      topNodes: sortedByExp.slice(0, 5),
      totalNodes: Object.keys(nodes).length,
      totalExp,
      totalLevels,
      expToday,
      expYesterday,
      highestExpNode: sortedByExp[0] || null,
      highestLevelNode: sortedByLevel[0] || null
    };
  }, [entries, nodes, playerStatistics, tree]);

  const toggleView = () => {
    setActiveTab(prev => prev === 'player-status' ? 'all-statistics' : 'player-status');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Header Profile Section */}
      <StatsHeader 
        userInformation={userInformation}
        totalExp={stats.totalExp}
        expToday={stats.expToday}
        expYesterday={stats.expYesterday}
        playerExpProgress={stats.playerExpProgress}
      />

      {/* Main View Area */}
      <div className="min-h-[400px]">
        {activeTab === 'player-status' ? (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <PlayerStatusTab 
              totalExp={stats.totalExp}
              highestLevel={stats.highestLevelNode?.level || 1}
              highestLevelNodeLabel={stats.highestLevelNode?.label}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
            {/* Main Stats Column */}
            <div className="lg:col-span-8 space-y-8">
              {/* User Statistics Table */}
              <StatsTable 
                totalNodes={stats.totalNodes}
                totalExp={stats.totalExp}
                totalLevels={stats.totalLevels}
                highestExpNode={stats.highestExpNode}
                highestLevelNode={stats.highestLevelNode}
              />

              {/* Core Attributes Grid */}
              <AttributesGrid domains={stats.domains} />
            </div>

            {/* Sidebar Column */}
            <div className="lg:col-span-4 space-y-8">
              {/* Top Mastery List */}
              <MasteryList topNodes={stats.topNodes} />

              {/* System Status */}
              <SystemStatus totalEntries={stats.totalEntries} />
            </div>
          </div>
        )}
      </div>

      {/* View Switcher Footer Component */}
      <div className="pt-12 border-t border-slate-200">
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Analysis Navigation</p>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => setActiveTab('player-status')}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest ${
                activeTab === 'player-status'
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <User className="w-4 h-4" />
              Player Status
            </button>
            <button
              onClick={() => setActiveTab('all-statistics')}
              className={`flex items-center gap-3 px-8 py-3 rounded-xl transition-all duration-300 font-black text-[11px] uppercase tracking-widest ${
                activeTab === 'all-statistics'
                  ? 'bg-white text-indigo-600 shadow-md ring-1 ring-slate-200'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              All Statistics
            </button>
          </div>
          <button 
            onClick={toggleView}
            className="flex items-center gap-2 mt-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline decoration-2 underline-offset-4"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            Quick Toggle
          </button>
        </div>
      </div>
    </div>
  );
};

export default StatisticsView;
