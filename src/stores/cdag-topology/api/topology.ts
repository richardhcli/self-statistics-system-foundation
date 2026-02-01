import { apiClient } from '@/lib/api-client';
import { CdagTopology } from '../types';
import { useCdagTopologyStore } from '../store';

/**
 * Remote API: Fetch topology from backend.
 */
export const getTopology = (baseUrl: string): Promise<CdagTopology> => {
  return apiClient(`${baseUrl}/cdag-topology`);
};

/**
 * Remote API: Persist topology to backend.
 */
export const updateTopology = (
  baseUrl: string,
  topology: CdagTopology
): Promise<void> => {
  return apiClient(`${baseUrl}/cdag-topology`, {
    data: topology,
    method: 'POST',
  });
};

/**
 * Local API: Get current topology for serialization.
 */
export const getCdagTopology = (): CdagTopology => {
  return useCdagTopologyStore.getState().getTopology();
};

/**
 * Local API: Load topology from storage/backend.
 */
export const setCdagTopology = (topology: CdagTopology): void => {
  useCdagTopologyStore.getState().actions.setTopology(topology);
};
