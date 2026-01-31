
import { apiClient } from '@/lib/api-client';
import { CdagTopology } from '../types';

export const updateTopology = (baseUrl: string, topology: CdagTopology): Promise<void> => {
  return apiClient(`${baseUrl}/cdag-topology`, {
    data: topology,
    method: 'POST',
  });
};
