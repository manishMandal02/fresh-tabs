import { logger } from '@root/src/utils/logger';
import { getStorage } from './helpers/get';
import { IPinnedTab, ISpace, ITab } from '@root/src/types/global.types';
import { setStorage } from './helpers/set';
import { updateActiveTabInSpace } from './spaces';
import { StorageKey } from '@root/src/constants/app';

// get all tabs in space
export const getTabsInSpace = async (spaceId: string): Promise<ITab[] | null> => {
  try {
    const tabs = await getStorage<ITab[]>({ key: StorageKey.tabs(spaceId), type: 'local' });

    if (tabs?.length < 1) throw new Error('No tabs found for this space');

    return tabs;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting tabs in space spaceId: ${spaceId}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:26 ~ getTabsInSpace() ~ catch block',
    });
    return [];
  }
};

// set tabs for space
export const setTabsForSpace = async (spaceId: string, tabs: ITab[]): Promise<boolean> => {
  try {
    await setStorage({ type: 'local', key: StorageKey.tabs(spaceId), value: [...tabs.filter(t => !!t)] });

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error setting tabs for space spaceId: ${spaceId}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:35 ~ setTabsForSpace() ~ catch block',
    });
    return false;
  }
};

// get a tab in space by it's index number
export const getTab = async (spaceId: string, idx: number): Promise<ITab | null> => {
  try {
    // get all tabs in this space
    const tabs = await getTabsInSpace(spaceId);

    if (tabs?.length < 1) return null;

    const tab = tabs.find(t => t.index === idx);

    if (!tab) return null;

    return tab;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting tab tab-index: ${idx}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:49 ~ getTab() ~ catch block',
    });
    return null;
  }
};

//! not used - update/save tab url, title, etc

// const updateTab = async (spaceId: string, tab: ITab, idx: number): Promise<boolean> => {
//   try {
//     // get all tabs from the space
//     const tabs = await getTabsInSpace(spaceId);

//     if (tabs?.length < 1) throw new Error(`Tabs not found for this space: ${spaceId}.`);

//     let tabToUpdate = tabs.find(t1 => t1.index === idx && t1.id === tab.id);

//     const updatedTabs = tabs.filter(t2 => t2.index !== idx);

//     // check if tab exists
//     if (tabToUpdate?.id) {
//       // exists, update tab at index pos

//       tabToUpdate = tab;
//       updatedTabs.push(tabToUpdate);
//     } else {
//       // add new tab at index pos
//       updatedTabs.push(tab);
//     }

//     // save updated tabs to storage
//     await setTabsForSpace(spaceId, updatedTabs);

//     return true;
//   } catch (error) {
//     logger.error({
//       error,
//       msg: `Error updating tab: ${tab.title}`,
//       fileTrace: 'src/services/chrome-storage/tabs.ts:101 ~ updateTab() ~ catch block',
//     });
//     return false;
//   }
// };

// remove/delete a tab
export const removeTabFromSpace = async (
  space: ISpace,
  id?: number,
  index?: number,
  removeFromWindow = false,
): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(space.id);

    if (tabs?.length < 1) throw new Error('No tabs found.');

    const tabToDelete = tabs.find(t => (id ? t.id === id : t.index === index));

    // do nothing, if only 1 tab remaining
    if (!tabToDelete || tabs.length === 1) return false;

    const updatedTabs = tabs.filter(t => t.id !== tabToDelete.id);

    console.log('🚀 ~ updatedTabs:', updatedTabs);

    // save new tab arrays to storage
    await setTabsForSpace(space.id, updatedTabs);

    // update active index for space to 0,  if this tab was the last active tab for this space
    if (space.activeTabIndex === tabToDelete.index) {
      await updateActiveTabInSpace(space.windowId, 0);
    }

    // remove tab from window, when deleted from spaces view
    if (removeFromWindow) {
      // get tab details
      const tab = await chrome.tabs.get(tabToDelete.id);

      // delete tab if it's opened
      if (tab?.id) await chrome.tabs.remove(tabToDelete.id);
    }

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error removing tabs from space: ${space?.title}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:160 ~ removeTabFromSpace() ~ catch block',
    });
    return false;
  }
};

// save pinned tabs
export const saveGlobalPinnedTabs = async (tabs: IPinnedTab[]): Promise<boolean> => {
  try {
    await setStorage({ type: 'sync', key: StorageKey.PINNED_TABS, value: tabs });
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error saving pinned tabs to chrome storage`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:186 ~ savePinnedTabs() ~ catch block',
    });
    return false;
  }
};

// save pinned tabs
export const getGlobalPinnedTabs = async (): Promise<IPinnedTab[]> => {
  try {
    return await getStorage<IPinnedTab[]>({ type: 'sync', key: StorageKey.PINNED_TABS });
  } catch (error) {
    logger.error({
      error,
      msg: `Error saving pinned tabs to chrome storage`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:186 ~ savePinnedTabs() ~ catch block',
    });
    return null;
  }
};
