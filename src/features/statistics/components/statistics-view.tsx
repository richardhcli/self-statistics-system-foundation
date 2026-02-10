
import React, { useMemo, useState } from 'react';
import { useJournalEntries, useJournalTree } from '@/stores/journal';
import { useGraphNodes, useGraphEdges, useGraphStructure } from '@/stores/cdag-topology';
import { usePlayerStatistics } from '@/stores/player-statistics';
import { useUserInformation } from '@/stores/user-information';
import { HorizontalTabNav } from '@/components/tabs';
import type { TabConfig } from '@/components/tabs';
import { StatsHeader } from './stats-header';
import { StatusView } from './status-view';
import { ExperienceView } from './experience-view';
import { LevelView } from './level-view';
import { AllStatisticsView } from './all-statistics-view';
import { LayoutGrid, User, Zap, Layers } from 'lucide-react';

type TabType = 'status' | 'experience' | 'levels' | 'all-statistics';

const StatisticsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('status');
  const entries = useJournalEntries();
  const tree = useJournalTree();
  const nodes = useGraphNodes();
  const edges = useGraphEdges();
  const structure = useGraphStructure();
  const playerStatistics = usePlayerStatistics();
  const userInformation = useUserInformation();

  const stats = useMemo(() => {
    let totalEntries = 0;
    let totalExp = 0;

    // Aggregation Logic for Header Stats
    Object.values(entries).forEach((entry) => {
      if (entry.content) totalEntries++;
    });

    const playerExpProgress = (totalEntries % 5) * 20;

    const nodesWithStats = Object.entries(playerStatistics).map(([label, s]) => {
      const nodeStats = s as { experience?: number; level?: number };
      const experience = Number(nodeStats.experience ?? 0);
      totalExp += experience;
      return { label, experience, level: Number(nodeStats.level ?? 0) };
    });

    const sortedByExp = [...nodesWithStats].sort((a, b) => b.experience - a.experience);

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
      playerExpProgress,
      topNodes: sortedByExp.slice(0, 10),
      totalNodes: Object.keys(nodes).length,
      totalEdges: structure?.metrics?.edgeCount ?? 0,
      totalExp,
      totalLevels: 0,
      expToday,
      expYesterday,
      highestExpNode: sortedByExp[0] || null,
      highestLevelNode: null,
    };
  }, [entries, nodes, playerStatistics, structure, tree]);

  const tabs: TabConfig<TabType>[] = [
    { id: 'status', label: 'Status', icon: User },
    { id: 'experience', label: 'Experience', icon: Zap },
    { id: 'levels', label: 'Levels', icon: Layers },
    { id: 'all-statistics', label: 'All Statistics', icon: LayoutGrid },
  ];

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

      <div className="flex items-center">
        <HorizontalTabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          className="w-full"
        />
      </div>

      {/* Main View Area */}
      <div className="min-h-[400px]">
        {activeTab === 'status' && (
          <div className="animate-in fade-in slide-in-from-left-4 duration-500">
            <StatusView
              totalExp={stats.totalExp}
              playerStatistics={playerStatistics}
              nodes={nodes}
              edges={edges}
              entries={entries}
            />
          </div>
        )}
        {activeTab === 'experience' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <ExperienceView topNodes={stats.topNodes} />
          </div>
        )}
        {activeTab === 'levels' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <LevelView
              playerStatistics={playerStatistics}
              totalExp={stats.totalExp}
            />
          </div>
        )}
        {activeTab === 'all-statistics' && (
          <div className="animate-in fade-in slide-in-from-right-4 duration-500">
            <AllStatisticsView
              totalExp={stats.totalExp}
              totalLevels={stats.totalLevels}
              highestExpNode={stats.highestExpNode}
              highestLevelNode={stats.highestLevelNode}
              totalNodes={stats.totalNodes}
              totalEdges={stats.totalEdges}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatisticsView;
