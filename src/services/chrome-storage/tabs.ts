import { logger } from '@root/src/pages/utils/logger';
import { getStorage } from './helpers/get';
import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { setStorage } from './helpers/set';
import { getFaviconURL } from '@root/src/pages/utils';
import { updateActiveTabInSpace } from './spaces';

// get all tabs in space
export const getTabsInSpace = async (spaceId: string): Promise<ITab[] | null> => {
  try {
    const tabs = await getStorage<ITab[]>({ key: spaceId, type: 'local' });

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
export const updateTabIndex = async (spaceId: string, oldIndex: number, newIndex: number): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(spaceId);

    if (tabs?.length < 1) return false;

    // remove tab from old index
    const tabToUpdate = tabs.splice(oldIndex, 1);

    // add tab to new index (array mutation)
    tabs.splice(newIndex, 0, tabToUpdate[0]);

    // save new list to storage
    await setStorage({ type: 'local', key: spaceId, value: tabs });

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error updating tab's index tab-index: ${oldIndex}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:67 ~ updateTabIndex() ~ catch block',
    });
    return false;
  }
};

// save new tab to space
export const saveNewTab = async (
  id: number,
  spaceId: string,
  url: string,
  title: string,
  idx: number,
): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(spaceId);

    if (tabs?.length < 1) return false;

    const newTab: ITab = {
      id,
      url,
      title,
      faviconURL: getFaviconURL(url),
    };

    // add new tab (array mutation)
    tabs.splice(idx, 0, newTab);

    // save new list to storage
    await setStorage({ type: 'local', key: spaceId, value: tabs });

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error saving tab: ${title}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:89 ~ saveNewTab() ~ catch block',
    });
    return false;
  }
};

// update/save tab url, title, etc
export const updateTab = async (spaceId: string, tab: ITab, idx: number): Promise<ITab | null> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(spaceId);

    // update tab at index pos
    tabs[idx] = tab;

    // save new list to storage
    await setStorage({ type: 'local', key: spaceId, value: tabs });

    return tabs[idx];
  } catch (error) {
    logger.error({
      error,
      msg: `Error updating tab: ${tab.title}`,
      fileTrace: 'src/services/chrome-storage/tabs.ts:101 ~ updateTab() ~ catch block',
    });
    return null;
  }
};

// remove/delete a tab
export const removeTabFromSpace = async (space: ISpace, id: number, removeFromWindow = false): Promise<boolean> => {
  try {
    // get all tabs from the space
    const tabs = await getTabsInSpace(space.id);

    if (tabs?.length < 1) return false;

    // do nothing, if only 1 tab remaining
    if (tabs.length === 1 || !tabs.find(t => t.id === id)) return false;

    // save new list to storage
    await setStorage({ type: 'local', key: space.id, value: [...tabs.filter(t => t.id !== id)] });

    // update active index for space to 0,  if this tab was the last active tab for this space
    if (space.activeTabIndex === tabs.findIndex(t => t.id === id)) {
      await updateActiveTabInSpace(space.windowId, 0);
    }

    // remove tab from window, when deleted from spaces view
    if (removeFromWindow) {
      await chrome.tabs.remove(id);
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
