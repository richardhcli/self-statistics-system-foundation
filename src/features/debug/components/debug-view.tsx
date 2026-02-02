import React, { useState } from 'react';
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
import DebugTabs, { DebugTab } from './debug-tabs';

/**
 * Props for DebugView component
 * Follows the "Slot Pattern" from feature-composition.md
 * @property {React.ReactNode} graphViewSlot - Composed graph editor component from another feature
 */
interface DebugViewProps {
  graphViewSlot: React.ReactNode;
}

/**
 * DebugView Component
 * 
 * Debug console feature with tabbed navigation.
 * Implements the "Slot Pattern" for composition - accepts graph editor via prop injection.
 * 
 * Responsibilities:
 * 1. Provides debug console tools (injection, stats, persistence, etc.)
 * 2. Hosts composed graph editor in a separate tab
 * 3. Maintains tab state internally (Console vs Graph)
 * 
 * State Management:
 * - Uses cdag-topology store for node data
 * - Uses player-statistics store for XP tracking
 * - Tab state is local to this component
 * 
 * Composition Strategy:
 * - graphViewSlot is injected at the App/Page level (composition root)
 * - No direct import of developer-graph feature - maintains decoupling
 * 
 * @param {DebugViewProps} props - Component props with composed slots
 * @returns {JSX.Element} Debug view with tabbed interface
 */
const DebugView: React.FC<DebugViewProps> = ({ graphViewSlot }) => {
  const [activeTab, setActiveTab] = useState<DebugTab>('console');
  const nodes = useGraphNodes();
  const stats = usePlayerStatistics();
  const { addExperience } = usePlayerStatisticsActions();
  const nodeLabels = Object.keys(nodes);

  /**
   * Records player experience for multiple actions
   * @param {string[]} actions - Action node IDs to award XP
   * @param {number} exp - Experience points to award per action
   */
  const recordExperience = (actions: string[], exp: number) => {
    actions.forEach((action) => addExperience(action, exp));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <DebugTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Tab Content */}
      {activeTab === 'console' && (
        <div className="flex-1 overflow-auto">
          <div className="max-w-4xl mx-auto space-y-6 p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
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
        </div>
      )}

      {activeTab === 'graph' && (
        <div className="flex-1 overflow-hidden">
          {graphViewSlot}
        </div>
      )}
    </div>
  );
};

export default DebugView;
