import { AppData, CdagTopology, TextToActionResponse } from '@/types';
import { processTextToAction, generalizeConcept } from '@/lib/google-ai';
import { mergeTopology, nodeExists } from '@/stores/cdag-topology';
import { applyScaledProgression } from '@/stores/player-statistics';
import { getNormalizedDate } from '@/features/journal/utils/time-utils';
import { updateJournalHTML } from '@/features/journal/utils/journal-entry-utils';

/**
 * createJournalEntry
 * Full lifecycle of a journal entry: AI analysis, topology merging, 
 * EXP propagation, and data persistence.
 */
export const createJournalEntry = async (
  context: { 
    entry: string; 
    actions?: string[]; 
    useAI?: boolean; 
    dateInfo?: any;
    duration?: string;
  },
  setData: (fn: (prev: AppData) => AppData) => void,
  currentAppData: AppData // Pass current state for characteristic existence check
): Promise<TextToActionResponse | null> => {
  const { entry, actions = [], useAI = false, dateInfo, duration } = context;
  const date = getNormalizedDate(dateInfo);

  if (useAI) {
    const analysis = await processTextToAction(entry);
    const finalDuration = analysis.duration || duration;
    
    // Check if any characteristic in the analysis is new
    const hasNewCharacteristic = analysis.characteristics.some(c => !nodeExists(currentAppData.cdagTopology, c));
    let generalizationChain: { child: string; parent: string; weight: number }[] = [];

    if (hasNewCharacteristic) {
      const actionLabels = analysis.weightedActions.map(a => a.label);
      const genResult = await generalizeConcept(actionLabels, analysis.skills, analysis.characteristics);
      generalizationChain = genResult.chain || [];
    }

    setData(prev => {
      let currentData = { ...prev };

      // 1. Build Layered Topology Fragment
      const incomingTopology: CdagTopology = {};
      const topCharacteristic = analysis.characteristics[0] || "General Domain";
      const primarySkill = analysis.skills[0] || "General Activity";

      // Base 3-layer structure
      incomingTopology[topCharacteristic] = { parents: {}, type: 'characteristic' };
      incomingTopology[primarySkill] = { 
        parents: { [topCharacteristic]: 1.0 },
        type: 'skill'
      };
      
      analysis.weightedActions.forEach(wa => {
        incomingTopology[wa.label] = { 
          parents: { [primarySkill]: wa.weight },
          type: 'action'
        };
      });

      // 2. Merge Generalization Chain if it exists
      generalizationChain.forEach(link => {
        if (!incomingTopology[link.child]) {
          incomingTopology[link.child] = { parents: {}, type: 'none' };
        }
        if (!incomingTopology[link.parent]) {
          incomingTopology[link.parent] = { parents: {}, type: 'none' };
        }
        // Link child to parent in the abstract hierarchy
        incomingTopology[link.child].parents[link.parent] = link.weight;
      });

      // Ensure that if the chain didn't reach progression, we at least try to bridge the top
      // (The prompt says generalization stops at progression, so we expect progression to be a parent)

      currentData = mergeTopology(currentData, incomingTopology);

      // 3. Propagate Progression (EXP)
      const actionLabels = analysis.weightedActions.map(wa => wa.label);
      const { data: nextStats, totalIncrease, levelsGained, nodeIncreases } = applyScaledProgression(
        currentData, 
        actionLabels, 
        finalDuration
      );
      
      currentData = nextStats;

      const journalEntryWithMeta = { 
        content: entry, 
        duration: finalDuration,
        weightedActions: analysis.weightedActions,
        metadata: { 
          totalExp: totalIncrease, 
          levelsGained, 
          nodeIncreases 
        } 
      };

      if (analysis.weightedActions.length > 0) {
        currentData = {
          ...currentData,
          userInformation: {
            ...currentData.userInformation,
            mostRecentAction: analysis.weightedActions[0].label
          }
        };
      }

      return updateJournalHTML(currentData, date, journalEntryWithMeta);
    });

    return analysis;
  } else {
    setData(prev => {
      let currentData = { ...prev };
      const incomingTopology: CdagTopology = {};
      actions.forEach(a => { 
        if (!nodeExists(currentData.cdagTopology, a)) {
          incomingTopology[a] = { parents: {}, type: 'action' };
        }
      });
      currentData = mergeTopology(currentData, incomingTopology);

      const { data: nextStats, totalIncrease, levelsGained, nodeIncreases } = applyScaledProgression(
        currentData, 
        actions, 
        duration
      );
      
      currentData = nextStats;

      const journalEntryWithMeta = { 
        content: entry, 
        duration,
        actions: actions.length > 0 ? actions : undefined,
        metadata: { 
          totalExp: totalIncrease, 
          levelsGained, 
          nodeIncreases 
        } 
      };

      if (actions.length > 0) {
        currentData = {
          ...currentData,
          userInformation: {
            ...currentData.userInformation,
            mostRecentAction: actions[actions.length - 1]
          }
        };
      }

      return updateJournalHTML(currentData, date, journalEntryWithMeta);
    });
    return null;
  }
};