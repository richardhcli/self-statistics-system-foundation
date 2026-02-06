import React from "react";
import { useGraphNodes } from "@/stores/cdag-topology";
import { usePlayerStatistics, usePlayerStatisticsActions } from "@/stores/player-statistics";
import DebugHeader from "./debug-header";
import SystemLog from "./system-log";
import DirectInput from "./direct-input";
import TopologyManager from "./topology-manager";
import PersistenceView from "./persistence-view";
import PlayerStatsView from "./player-stats-view";
import BrowserInfoView from "./browser-info-view";
import DataInjectionPanel from "./data-injection-panel";

/**
 * DebugConsolePanel
 * 
 * Console-focused debug tools panel.
 * This panel is URL-routed under /app/debug/console.
 * 
 * Responsibilities:
 * - Render debug utilities (logs, data injection, stats, persistence)
 * - Read-only access to stores for diagnostics
 * 
 * @returns JSX.Element
 */
const DebugConsolePanel: React.FC = () => {
  const nodes = useGraphNodes();
  const stats = usePlayerStatistics();
  const { addExperience } = usePlayerStatisticsActions();
  const nodeLabels = Object.keys(nodes);

  /**
   * Records player experience for multiple actions.
   * 
   * @param actions - Action node IDs
   * @param exp - Experience points to award per action
   */
  const recordExperience = (actions: string[], exp: number) => {
    actions.forEach((action) => addExperience(action, exp));
  };

  return (
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
  );
};

export default DebugConsolePanel;
