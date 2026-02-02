
import React from 'react';
import { useGraphNodes } from '@/stores/cdag-topology';
import { usePlayerStatistics, usePlayerStatisticsActions } from '@/stores/player-statistics';
import DebugHeader from './debug-header';
import SystemLog from './system-log';
import DirectInput from './direct-input';
import TopologyManager from './topology-manager';
import PersistenceView from './persistence-view';
import PlayerStatsView from './player-stats-view';
import BrowserInfoView from './browser-info-view';
import DataInjectionPanel from './data-injection-panel';
const DebugView: React.FC = () => {
  const nodes = useGraphNodes();
  const stats = usePlayerStatistics();
  const { addExperience } = usePlayerStatisticsActions();
  const nodeLabels = Object.keys(nodes);

  const recordExperience = (actions: string[], exp: number) => {
    actions.forEach((action) => addExperience(action, exp));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DebugHeader />
      <div className="grid grid-cols-1 gap-6">
        <SystemLog />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataInjectionPanel />
          <DirectInput nodeLabels={nodeLabels} recordExperience={recordExperience} />
        </div>
        <PlayerStatsView stats={stats} />
        <TopologyManager />
        <PersistenceView />
        <BrowserInfoView />
      </div>
    </div>
  );
};

export default DebugView;
