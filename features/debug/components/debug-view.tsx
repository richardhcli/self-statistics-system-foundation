
import React from 'react';
import { AppData, CdagNodeData } from '@/types';
import DebugHeader from './debug-header';
import SystemLog from './system-log';
import DirectInput from './direct-input';
import TopologyManager from './topology-manager';
import PersistenceView from './persistence-view';
import PlayerStatsView from './player-stats-view';
import BrowserInfoView from './browser-info-view';
import DataInjectionPanel from './data-injection-panel';

interface DebugViewProps {
  data: AppData;
  setData: (fn: (prev: AppData) => AppData) => void;
  updateTopologyNode: (label: string, nodeData: CdagNodeData) => void;
  deleteTopologyNode: (label: string) => void;
  addTopologyNode: (label: string, parents?: Record<string, number>) => void;
  recordExperience: (actions: string[], exp: number) => void;
}

const DebugView: React.FC<DebugViewProps> = ({ 
  data, 
  setData, 
  updateTopologyNode, 
  deleteTopologyNode, 
  addTopologyNode, 
  recordExperience 
}) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <DebugHeader data={data} setData={setData} />
      <div className="grid grid-cols-1 gap-6">
        <SystemLog data={data} />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DataInjectionPanel />
          <DirectInput nodes={data.visualGraph.nodes} recordExperience={recordExperience} />
        </div>
        <PlayerStatsView stats={data.playerStatistics} />
        <TopologyManager 
          data={data} 
          updateTopologyNode={updateTopologyNode} 
          deleteTopologyNode={deleteTopologyNode} 
          addTopologyNode={addTopologyNode} 
        />
        <PersistenceView data={data} />
        <BrowserInfoView />
      </div>
    </div>
  );
};

export default DebugView;
