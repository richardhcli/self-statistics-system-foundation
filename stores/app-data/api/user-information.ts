
import { apiClient } from '@/lib/api-client';
import { UserInformation } from '../../user-data/types';

export const getUserInfo = (baseUrl: string): Promise<UserInformation> => {
  return apiClient(`${baseUrl}/user-information`);
};

export const updateUserInfo = (baseUrl: string, userInfo: UserInformation): Promise<void> => {
  return apiClient(`${baseUrl}/user-information`, {
    data: userInfo,
    method: 'POST',
  });
};
