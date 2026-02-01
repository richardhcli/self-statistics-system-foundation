import { AppData, CdagTopology } from '@/types';
import { getExistingLabel } from './checker';
import { createNode } from './manager';
import { LEARNING_RATE } from '@/lib/config';

/**
 * Merges an incoming CdagTopology structure into the application state.
 * If nodes exist, it adjusts edge weights using the global LEARNING_RATE.
 * If nodes are new, it registers them with their specified types.
 */
export const mergeTopology = (data: AppData, incoming: CdagTopology): AppData => {
  let current = { ...data };

  Object.entries(incoming).forEach(([nodeLabel, nodeData]) => {
    const existingLabel = getExistingLabel(current.cdagTopology, nodeLabel);

    if (!existingLabel) {
      // Node is brand new, create it with specified type
      current = createNode(current, nodeLabel, nodeData.parents, nodeData.type);
    } else {
      // Node exists, merge parents/weights and potentially update type if it was 'none'
      const currentTopology = { ...current.cdagTopology };
      const currentNodeData = { ...currentTopology[existingLabel] };

      // Upgrade type if the new data is more specific
      if (currentNodeData.type === 'none' && nodeData.type !== 'none') {
        currentNodeData.type = nodeData.type;
      }

      const currentParents = { ...currentNodeData.parents };

      Object.entries(nodeData.parents).forEach(([parentLabel, incomingWeight]) => {
        const existingParentLabel = getExistingLabel(current.cdagTopology, parentLabel) || parentLabel;

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
      currentTopology[existingLabel] = currentNodeData;
      current = { ...current, cdagTopology: currentTopology };
    }
  });

  return current;
};
