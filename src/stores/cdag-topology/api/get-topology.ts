
import { apiClient } from '@/lib/api-client';
import { CdagTopology } from '../types';

export const getTopology = (baseUrl: string): Promise<CdagTopology> => {
  return apiClient(`${baseUrl}/cdag-topology`);
};
