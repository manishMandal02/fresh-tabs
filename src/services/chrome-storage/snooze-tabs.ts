// get all tabs in space

import { logger } from '@root/src/pages/utils/logger';
import { getStorage, setStorage } from './helpers';
import { ISnoozedTab } from '@root/src/pages/types/global.types';

export const getAllSnoozedTabs = async () => {
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

export const setSnoozedTabs = async (snoozedTabs: ISnoozedTab[]) => {
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

// get a single snoozed tab
export const getSnoozedTab = async (id: string) => {
  const snoozedTabs = await getAllSnoozedTabs();
  const snoozedTab = snoozedTabs.find(tab => tab.id === id);
  if (snoozedTab) return snoozedTab;
  return null;
};

// remove a single snoozed tab
export const removeSnoozedTab = async (id: string) => {
  const snoozedTabs = await getAllSnoozedTabs();
  const newSnoozedTabs = snoozedTabs.filter(tab => tab.id !== id);
  return setSnoozedTabs(newSnoozedTabs);
};
