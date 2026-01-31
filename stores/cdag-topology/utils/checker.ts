
import { CdagTopology } from '../types';

/**
 * Validates node presence in the cdagTopology using normalized comparison.
 */
export const nodeExists = (topology: CdagTopology, label: string): boolean => {
  const normalized = label.toLowerCase().trim();
  return Object.keys(topology).some(k => k.toLowerCase().trim() === normalized);
};

/**
 * Retrieves the exact casing of a label if it exists in the topology.
 */
export const getExistingLabel = (topology: CdagTopology, label: string): string | undefined => {
  const normalized = label.toLowerCase().trim();
  return Object.keys(topology).find(k => k.toLowerCase().trim() === normalized);
};
