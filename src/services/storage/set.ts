import { StorageKeys } from '@root/src/constants/app';
import { ISpace } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';

type StorageValue = ISpace | ISpace[];

type SetStorageParams = {
  type: 'local' | 'sync';
  key: StorageKeys;
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
      return true;
    }
    // sync storage
    if (type === 'sync') {
      await chrome.storage.sync.set({
        [key]: value,
      });
      return true;
    }

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error setting chrome storage',
      fileTrace: 'src/utils/setStorage.ts:37 ~ catch block',
    });
    return false;
  }
};
