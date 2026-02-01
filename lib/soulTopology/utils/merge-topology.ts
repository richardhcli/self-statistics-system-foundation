import { CdagTopology, NodeType } from '@/types';
import { getExistingLabel, nodeExists } from './checker';
import { LEARNING_RATE } from '@/lib/config';

/**
 * Merges an incoming CdagTopology structure into an existing topology.
 * If nodes exist, it adjusts edge weights using the global LEARNING_RATE.
 * If nodes are new, it registers them with their specified types.
 * 
 * @param currentTopology - The existing CDAG topology
 * @param incoming - The incoming topology fragment to merge
 * @returns The merged topology
 */
export const mergeTopology = (currentTopology: CdagTopology, incoming: CdagTopology): CdagTopology => {
  let result = { ...currentTopology };

  Object.entries(incoming).forEach(([nodeLabel, nodeData]) => {
    const existingLabel = getExistingLabel(result, nodeLabel);

    if (!existingLabel) {
      // Node is brand new, create it with specified type
      result = {
        ...result,
        [nodeLabel]: {
          parents: nodeData.parents,
          type: nodeData.type
        }
      };
    } else {
      // Node exists, merge parents/weights and potentially update type if it was 'none'
      const currentNodeData = { ...result[existingLabel] };

      // Upgrade type if the new data is more specific
      if (currentNodeData.type === 'none' && nodeData.type !== 'none') {
        currentNodeData.type = nodeData.type;
      }

      const currentParents = { ...currentNodeData.parents };

      Object.entries(nodeData.parents).forEach(([parentLabel, incomingWeight]) => {
        const existingParentLabel = getExistingLabel(result, parentLabel) || parentLabel;

        if (currentParents[existingParentLabel] === undefined) {
          // New edge for existing node
          currentParents[existingParentLabel] = incomingWeight;
        } else {
          // Existing edge: Apply Learning Rate adjustment
          const currentWeight = currentParents[existingParentLabel];
          const diff = incomingWeight - currentWeight;
          if (diff !== 0) {
            const adjustment = Math.sign(diff) * LEARNING_RATE;
            currentParents[existingParentLabel] = Math.max(0.01, Math.min(1.0, currentWeight + adjustment));
          }
        }
      });

      currentNodeData.parents = currentParents;
      result = { ...result, [existingLabel]: currentNodeData };
    }
  });

  return result;
};
