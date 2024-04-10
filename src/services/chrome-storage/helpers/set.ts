import { StorageKey } from '@root/src/constants/app';
import {
  IAppSettings,
  IDailySpaceTime,
  IDailySpaceTimeChunks,
  INote,
  IPinnedTab,
  ISiteVisit,
  ISnoozedTab,
  ISpace,
  ITab,
} from '@root/src/types/global.types';
import { UnionTypeFromObjectValues } from '@root/src/types/utility.types';
import { logger } from '@root/src/utils/logger';

type StorageValue =
  | ISpace
  | ISpace[]
  | INote[]
  | ITab[]
  | ISnoozedTab[]
  | ISiteVisit[]
  | IDailySpaceTimeChunks[]
  | IDailySpaceTime[]
  | IAppSettings
  | IPinnedTab[]
  | string;

type SetStorageParams = {
  type: 'local' | 'sync';
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
