import { CdagTopology, NodeType } from '@/types';
import { nodeExists } from './checker';

/**
 * Creates a new node in the topology if it doesn't already exist.
 * Returns the modified topology.
 * 
 * @param topology - Current topology
 * @param label - Node label
 * @param parents - Parent edges with weights
 * @param type - Node type (concept, skill, characteristic, context, none)
 * @returns Updated topology
 */
export const createNode = (
  topology: CdagTopology,
  label: string,
  parents: Record<string, number> = {},
  type: NodeType = 'none'
): CdagTopology => {
  if (nodeExists(topology, label)) return topology;
  return {
    ...topology,
    [label]: { parents, type }
  };
};
