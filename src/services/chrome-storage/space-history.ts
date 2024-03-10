import { logger } from '@root/src/pages/utils';
import { getStorage, setStorage } from './helpers';
import { StorageKey } from '@root/src/constants/app';
import { ISiteVisit } from '@root/src/pages/types/global.types';

// get full space history (past 30d)
export const getSpaceHistory = async (spaceId: string, shouldGetFullHistory = false) => {
  const key = shouldGetFullHistory ? StorageKey.spaceHistoryAll(spaceId) : StorageKey.spaceHistoryToday(spaceId);
  try {
    return await getStorage<ISiteVisit[]>({ key, type: 'local' });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting space history',
      fileTrace: 'src/services/chrome-storage/space-history.ts:15 ~ getSpaceHistory() ~ catch block',
    });
    return [];
  }
};

// set space history to storage
export const setSpaceHistory = async (
  spaceId: string,
  spaceHistoryToday: ISiteVisit[],
  shouldSetFullHistory = false,
) => {
  const key = shouldSetFullHistory ? StorageKey.spaceHistoryAll(spaceId) : StorageKey.spaceHistoryToday(spaceId);

  try {
    return await setStorage({ key, type: 'local', value: spaceHistoryToday });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error setting space history',
      fileTrace: 'src/services/chrome-storage/space-history.ts:28 ~ setSpaceHistory() ~ catch block',
    });
    return false;
  }
};
