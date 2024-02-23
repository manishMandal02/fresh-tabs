// space usage in time records

import { StorageKey } from '@root/src/constants/app';
import { logger } from '@root/src/pages/utils';
import { getStorage, setStorage } from './helpers';
import { IDailySpaceTime, IDailySpaceTimeChunks } from '@root/src/pages/types/global.types';

// get full space history (past 30d)
export const getDailySpaceTime = async <T = IDailySpaceTime[]>(spaceId: string | null): Promise<T> => {
  const key = spaceId ? StorageKey.dailySpaceTimeAll(spaceId) : StorageKey.DAILY_SPACE_TIME_CHUNKS;
  try {
    return await getStorage<T>({ key, type: 'local' });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting time spent in space.',
      fileTrace: 'src/services/chrome-storage/space-analytics.ts:19 ~ getDailySpaceTime() ~ catch block',
    });
    return [] as T;
  }
};

// set space history to storage
export const setDailySpaceTime = async <T extends string | null = string>(
  spaceId: T,
  dailySpaceTime: IDailySpaceTime[] | IDailySpaceTimeChunks[],
) => {
  const key = spaceId ? StorageKey.dailySpaceTimeAll(spaceId) : StorageKey.DAILY_SPACE_TIME_CHUNKS;

  try {
    return await setStorage({ key, type: 'local', value: dailySpaceTime });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error setting time spent in space.',
      fileTrace: 'src/services/chrome-storage/space-analytics.ts:41 ~ setDailySpaceTime() ~ catch block',
    });
    return false;
  }
};
