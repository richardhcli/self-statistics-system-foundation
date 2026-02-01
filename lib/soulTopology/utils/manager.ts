import { AppData, NodeType } from '@/types';
import { nodeExists } from './checker';

/**
 * Creates a new node in the topology if it doesn't already exist.
 * Returns the modified AppData.
 */
export const createNode = (
  data: AppData,
  label: string,
  parents: Record<string, number> = {},
  type: NodeType = 'none'
): AppData => {
  if (nodeExists(data.cdagTopology, label)) return data;
  return {
    ...data,
    cdagTopology: {
      ...data.cdagTopology,
      [label]: { parents, type }
    }
  };
};
