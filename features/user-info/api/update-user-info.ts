
import { apiClient } from '@/lib/api-client';
import { UserInformation } from '../types';

/**
 * Persists user information to the remote backend server.
 */
export const updateUserInfo = (baseUrl: string, userInfo: UserInformation): Promise<void> => {
  return apiClient(`${baseUrl}/user-information`, {
    data: userInfo,
    method: 'POST',
  });
};
