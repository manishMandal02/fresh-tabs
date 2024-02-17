// get all tabs in space

import { logger } from '@root/src/pages/utils/logger';
import { getStorage, setStorage } from './helpers';
import { ISnoozedTab } from '@root/src/pages/types/global.types';

export const getSnoozedTabs = async (spaceId: string) => {
  try {
    return await getStorage<ISnoozedTab[]>({ key: `SNOOZED-${spaceId}`, type: 'local' });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting all snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:14 ~ getSnoozedTabs() ~ catch block',
    });
    return [];
  }
};

const setSnoozedTabs = async (spaceId: string, snoozedTabs: ISnoozedTab[]) => {
  try {
    return await setStorage({ key: `SNOOZED-${spaceId}`, type: 'local', value: snoozedTabs });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting all snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:13 ~ setSnoozedTabs() ~ catch block',
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
  const now = new Date();
  // set the time 2 mins after to get better results
  now.setMinutes(now.getMinutes() + 2);
  const snoozedTab = snoozedTabs.find(tab => tab.snoozeUntil < now.getTime());
  if (snoozedTab) return snoozedTab;
  return null;
};

// remove a single snoozed tab
export const removeSnoozedTab = async (spaceId: string, url: string) => {
  const snoozedTabs = await getSnoozedTabs(spaceId);
  const updatedSnoozedTabs = snoozedTabs.filter(tab => tab.url !== url && tab.snoozeUntil > new Date().getTime());
  return setSnoozedTabs(spaceId, updatedSnoozedTabs);
};
