import type { SoulTopologyStore } from '../config/store';

/**
 * Validates node presence in the topology using normalized comparison.
 */
export const nodeExists = (topology: SoulTopologyStore, label: string): boolean => {
  const normalized = label.toLowerCase().trim();
  return Object.keys(topology).some(k => k.toLowerCase().trim() === normalized);
};

/**
 * Retrieves the exact casing of a label if it exists in the topology.
 */
export const getExistingLabel = (topology: SoulTopologyStore, label: string): string | undefined => {
  const normalized = label.toLowerCase().trim();
  return Object.keys(topology).find(k => k.toLowerCase().trim() === normalized);
};
