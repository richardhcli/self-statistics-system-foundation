
import { useState, useCallback } from 'react';
import { AppData, CdagNodeData } from '@/types';
import { saveData } from '@/lib/db';
import { usePersistence } from '@/hooks/use-persistence';
import { useSyncGraphFromTopology } from '@/hooks/sync-graph-from-topology';
import * as topologyManager from '@/lib/soulTopology';
import { INITIAL_APP_DATA } from '@/stores/app-data';

/**
 * useAppData manages the root state of the application.
 * It acts as the single orchestrator for synchronizing logical topology with visual view-state.
 */
export const useAppData = () => {
  const [data, setData] = useState<AppData>(INITIAL_APP_DATA);
  usePersistence(data, setData, INITIAL_APP_DATA);
  
  // Logical Topology Actions
  const updateCdagGraph = useCallback((domain: string, activity: string, action: string) => {
    setData(prev => {
      const fragment: any = {
        [domain]: { parents: {}, type: 'characteristic' },
        [activity]: { parents: { [domain]: 1.0 }, type: 'skill' },
        [action]: { parents: { [activity]: 1.0 }, type: 'action' }
      };
      return topologyManager.mergeTopology(prev, fragment);
    });
  }, []);

  const updateTopologyNode = useCallback((label: string, nodeData: CdagNodeData) => {
    setData(prev => ({ 
      ...prev, 
      cdagTopology: { ...prev.cdagTopology, [label]: nodeData } 
    }));
  }, []);

  const deleteTopologyNode = useCallback((label: string) => {
    setData(prev => {
      const next = { ...prev.cdagTopology };
      delete next[label];
      return { ...prev, cdagTopology: next };
    });
  }, []);

  const addTopologyNode = useCallback((label: string, parents: Record<string, number> = {}) => {
    setData(prev => topologyManager.createNode(prev, label, parents));
  }, []);

  /**
   * Automated Visualization Synchronization
   * Ensures that cdagTopology changes are reflected in visualGraph automatically.
   */
  useSyncGraphFromTopology(data, setData);

  const resetData = async () => {
    setData(INITIAL_APP_DATA);
    await saveData(INITIAL_APP_DATA);
  };

  return { 
    data, 
    setData, 
    resetData, 
    updateCdagGraph, 
    updateTopologyNode, 
    deleteTopologyNode, 
    addTopologyNode 
  };
};
