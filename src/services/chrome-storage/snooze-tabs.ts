// get all tabs in space

import { getAllSpaces } from './spaces';
import { logger } from '@root/src/utils/logger';
import { getStorage, setStorage } from './helpers';
import { StorageKey } from '@root/src/constants/app';
import { ISnoozedTab } from '@root/src/types/global.types';

export const getAllSpacesSnoozedTabs = async () => {
  try {
    const allSpaces = await getAllSpaces();

    const allSnoozedTabsPromises = allSpaces.map(s => getSnoozedTabs(s.id));

    const promiseRes = await Promise.allSettled(allSnoozedTabsPromises);

    const allSnoozedTabs: ISnoozedTab[] = [];

    for (const res of promiseRes) {
      if (res.status !== 'fulfilled') continue;

      const snoozedTabs = res.value;

      if (!snoozedTabs || snoozedTabs?.length < 1) continue;

      allSnoozedTabs.push(...snoozedTabs);
    }
    return allSnoozedTabs;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting all spaces snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:29 ~ getAllSpacesSnoozedTabs() ~ catch block',
    });
    return [];
  }
};

export const getSnoozedTabs = async (spaceId: string) => {
  try {
    return await getStorage<ISnoozedTab[]>({ key: StorageKey.snoozed(spaceId), type: 'local' });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting all snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:42 ~ getSnoozedTabs() ~ catch block',
    });
    return [];
  }
};

const setSnoozedTabs = async (spaceId: string, snoozedTabs: ISnoozedTab[]) => {
  try {
    return await setStorage({ key: StorageKey.snoozed(spaceId), type: 'local', value: snoozedTabs });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error setting snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:55 ~ setSnoozedTabs() ~ catch block',
    });
    return false;
  }
};

// add a single snooze tab
export const addSnoozedTab = async (spaceId: string, snoozedTab: ISnoozedTab) => {
  const snoozedTabs = await getSnoozedTabs(spaceId);
  const updatedSnoozedTabs = [...(snoozedTabs || []), snoozedTab];
  return setSnoozedTabs(spaceId, updatedSnoozedTabs);
};

// get a tab that has to be un-snoozed (passed the trigger time)
export const getTabToUnSnooze = async (spaceId: string) => {
  const snoozedTabs = await getSnoozedTabs(spaceId);

  if (snoozedTabs?.length < 1) return null;
  const now = new Date();
  // set the time 2 mins after to get better results
  now.setMinutes(now.getMinutes() + 2);
  const snoozedTab = snoozedTabs?.find(tab => tab.snoozedUntil < now.getTime());
  if (!snoozedTab) return null;
  return snoozedTab;
};

// remove a single snoozed tab
export const removeSnoozedTab = async (spaceId: string, snoozedAt: number) => {
  const snoozedTabs = await getSnoozedTabs(spaceId);
  const updatedSnoozedTabs = snoozedTabs.filter(
    tab => tab.snoozedAt !== snoozedAt && tab.snoozedUntil > new Date().getTime(),
  );
  return setSnoozedTabs(spaceId, updatedSnoozedTabs);
};
