import { StorageKeys } from '@root/src/constants/app';
import { ISpace } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';

type GetStorageParams = {
  type: 'local' | 'sync';
  key: keyof typeof StorageKeys | `tabs-${string}` | `snoozed-${string}`;
};

// sets chrome storage by key
export const getStorage = async <T = null | ISpace>({ key, type }: GetStorageParams): Promise<T> => {
  let storageData = null;

  try {
    // local storages
    if (type === 'local') {
      // get local storage from chrome
      storageData = await chrome.storage.local.get(key);
    }
    // sync storage
    if (type === 'sync') {
      // get local storage from chrome
      storageData = await chrome.storage.sync.get(key);
    }

    if (storageData && typeof storageData[key] !== 'undefined') {
      return storageData[key];
    } else {
      return null;
    }
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting chrome storage',
      fileTrace: 'src/services/chrome-storage/helpers/get/getStorage.ts:35 ~ catch block',
    });
    return null;
  }
};
