
import { apiClient } from '@/lib/api-client';
import { UserInformation } from '../types';

/**
 * Fetches user information from the remote backend server.
 */
export const getUserInfo = (baseUrl: string): Promise<UserInformation> => {
  return apiClient(`${baseUrl}/user-information`);
};
