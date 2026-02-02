import { useUserInformationStore } from './store';
import { UserInformation } from './store';

/**
 * API: Fetch user information for serialization/remote sync.
 */
export const getUserInformation = (): UserInformation => {
  return useUserInformationStore.getState().info;
};

/**
 * API: Load user information from storage/backend.
 */
export const setUserInformation = (info: UserInformation): void => {
  useUserInformationStore.getState().actions.setInfo(info);
};

export { useUserInformation, useUserInformationActions } from './store';
export type { UserInformation } from './store';
