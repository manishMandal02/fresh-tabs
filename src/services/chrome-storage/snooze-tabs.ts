// get all tabs in space

import { logger } from '@root/src/pages/utils/logger';
import { getStorage, setStorage } from './helpers';
import { ISnoozedTab } from '@root/src/pages/types/global.types';

const getAllSnoozedTabs = async () => {
  try {
    return await getStorage<ISnoozedTab[]>({ key: 'snoozed-tabs', type: 'local' });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting all snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:13 ~ getAllSnoozedTabs() ~ catch block',
    });
    return [];
  }
};

const setSnoozedTabs = async (snoozedTabs: ISnoozedTab[]) => {
  try {
    return await setStorage({ key: 'snoozed-tabs', type: 'local', value: snoozedTabs });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting all snoozed tabs',
      fileTrace: 'src/services/chrome-storage/snoozed-tabs.ts:13 ~ getAllSnoozedTabs() ~ catch block',
    });
    return false;
  }
};

// add a single snooze tab
export const addSnoozedTab = async (snoozedTab: ISnoozedTab) => {
  const snoozedTabs = await getAllSnoozedTabs();
  const newSnoozedTabs = [...snoozedTabs, snoozedTab];
  return setSnoozedTabs(newSnoozedTabs);
};

// get a tab that has to be un-snoozed (passed the trigger time)
export const getTabToUnSnooze = async () => {
  const snoozedTabs = await getAllSnoozedTabs();
  const now = new Date();
  // set the time 2 mins before to get better results
  now.setMinutes(now.getMinutes() - 1);
  const snoozedTab = snoozedTabs.find(tab => tab.snoozeUntil < now.getTime());
  if (snoozedTab) return snoozedTab;
  return null;
};

// remove a single snoozed tab
export const removeSnoozedTab = async (url: string) => {
  const snoozedTabs = await getAllSnoozedTabs();
  const newSnoozedTabs = snoozedTabs.filter(tab => tab.url !== url && tab.snoozeUntil > new Date().getTime());
  return setSnoozedTabs(newSnoozedTabs);
};
