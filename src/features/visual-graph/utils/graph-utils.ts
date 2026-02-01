
import { CdagTopology } from '@/types';

/**
 * Graph Utilities for Visualization
 */

/**
 * Calculates the depth level of each node in the DAG using a bottom-up approach.
 * Root nodes (characteristics) are assigned the highest level, actions are assigned 0.
 * In our visualization logic, this "level" maps to topological rank from right-to-left.
 */
export const calculateLevels = (topology: CdagTopology): Record<string, number> => {
  const levels: Record<string, number> = {};
  const visiting = new Set<string>();
  const childrenMap: Record<string, string[]> = {};
  
  // Inverse the topology to find children
  Object.keys(topology).forEach(label => {
    Object.keys(topology[label].parents).forEach(parent => {
      if (!childrenMap[parent]) childrenMap[parent] = [];
      childrenMap[parent].push(label);
    });
  });

  const getLevel = (label: string): number => {
    if (levels[label] !== undefined) return levels[label];
    if (visiting.has(label)) return 0;
    visiting.add(label);
    const children = childrenMap[label] || [];
    const maxChildLevel = children.length === 0 ? -1 : Math.max(...children.map(getLevel));
    visiting.delete(label);
    levels[label] = 1 + maxChildLevel;
    return levels[label];
  };

  Object.keys(topology).forEach(getLevel);
  return levels;
};
