import { StorageKey } from '@root/src/constants/app';
import {
  IAppSettings,
  IContainer,
  IDailySpaceTime,
  IDailySpaceTimeChunks,
  IGroup,
  INote,
  INotification,
  IPinnedTab,
  ISiteVisit,
  ISnoozedTab,
  ISpace,
  ITab,
  IUser,
  IUserToken,
} from '@root/src/types/global.types';
import { UnionTypeFromObjectValues } from '@root/src/types/utility.types';
import { logger } from '@root/src/utils/logger';

type StorageValue =
  | IUser
  | IUserToken
  | ISpace
  | IContainer
  | ISpace[]
  | INote[]
  | ITab[]
  | IGroup[]
  | INotification[]
  | ISnoozedTab[]
  | ISiteVisit[]
  | IDailySpaceTimeChunks[]
  | IDailySpaceTime[]
  | IAppSettings
  | IPinnedTab[]
  | number[]
  | string;

type SetStorageParams = {
  type: 'local' | 'sync' | 'session';
  key: UnionTypeFromObjectValues<typeof StorageKey>;
  value: StorageValue;
};

// sets chrome storage by key
export const setStorage = async ({ key, value, type }: SetStorageParams) => {
  try {
    // local storages
    if (type === 'local') {
      await chrome.storage.local.set({
        [key]: value,
      });
    }
    // sync storage
    if (type === 'sync') {
      await chrome.storage.sync.set({
        [key]: value,
      });
    }
    // session storage
    if (type === 'session') {
      await chrome.storage.session.set({
        [key]: value,
      });
    }

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error setting chrome storage',
      fileTrace: 'src/services/chrome-storage/helpers/set/setStorage.ts:34 ~ catch block',
    });
    return false;
  }
};
