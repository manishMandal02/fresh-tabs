import { logger } from '@root/src/pages/utils/logger';
import { getStorage } from './helpers/get';
import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { setStorage } from './helpers/set';
import { updateActiveTabInSpace } from './spaces';

// get all tabs in space
export const getTabsInSpace = async (spaceId: string): Promise<ITab[] | null> => {
  try {
    const tabs = await getStorage<ITab[]>({ key: `tabs-${spaceId}`, type: 'local' });

    if (tabs?.length < 1) throw new Error('No tabs found for this space');

    return tabs;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting tabs in space spaceId: ${spaceId}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:26 ~ getTabsInSpace() ~ catch block',
    });
    return null;
  }
};

// set tabs for space
export const setTabsForSpace = async (spaceId: string, tabs: ITab[]): Promise<boolean> => {
  try {
    await setStorage({ type: 'local', key: `tabs-${spaceId}`, value: [...tabs.filter(t => !!t)] });

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

    const tab = tabs[idx];

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

// update tab index
export const updateTabIndex = async (spaceId: string, tabId: number, newIndex: number): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(spaceId);

    if (tabs?.length < 1) throw new Error(`Tabs not found for this space: ${spaceId}.`);

    const tabToUpdate = tabs.find(t => t.id === tabId);

    if (!tabToUpdate) throw new Error('Tab not found with this id.');

    // remove tab from old index
    const newTabs = tabs.filter(t => t.id !== tabId);

    // add tab to new index, mutate array
    newTabs.splice(newIndex, 0, tabToUpdate);

    // save new tabs array to storage
    await setTabsForSpace(spaceId, newTabs);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error updating tab's index tab-index: ${tabId}.`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:67 ~ updateTabIndex() ~ catch block',
    });
    return false;
  }
};

// update/save tab url, title, etc
export const updateTab = async (spaceId: string, tab: ITab, idx: number): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(spaceId);

    // check if tab exists
    if (tabs.find(t => t.id === tab.id)) {
      // exists, update tab at index pos
      tabs[idx] = tab;
    } else {
      // add new tab at index pos
      tabs.splice(idx, 1, tab);
    }

    // save updated tabs to storage
    await setTabsForSpace(spaceId, tabs);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error updating tab: ${tab.title}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:101 ~ updateTab() ~ catch block',
    });
    return false;
  }
};

// remove/delete a tab
export const removeTabFromSpace = async (space: ISpace, id: number, removeFromWindow = false): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(space.id);

    if (tabs?.length < 1) throw new Error('No tabs found.');

    // do nothing, if only 1 tab remaining
    if (tabs.length === 1 || !tabs.find(t => t.id === id)) return false;

    // save new tab arrays to storage
    await setTabsForSpace(space.id, [...tabs.filter(t => t.id !== id)]);

    // update active index for space to 0,  if this tab was the last active tab for this space
    if (space.activeTabIndex === tabs.findIndex(t => t.id === id)) {
      await updateActiveTabInSpace(space.windowId, 0);
    }

    // remove tab from window, when deleted from spaces view
    if (removeFromWindow) {
      // check if the tab is opened
      const tab = await chrome.tabs.get(id);

      // if not, do nothing
      if (tab?.id) {
        await chrome.tabs.remove(id);
      }
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
