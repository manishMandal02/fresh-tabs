import { logger } from '@root/src/pages/utils/logger';
import { getStorage } from './helpers/get';
import { ITab } from '@root/src/pages/types/global.types';
import { setStorage } from './helpers/set';
import { getFaviconURL } from '@root/src/pages/utils';

// get all tabs in space
export const getTabsInSpace = async (spaceId: string) => {
  try {
    const tabs = await getStorage<ITab[]>({ key: spaceId, type: 'sync' });

    if (tabs.length < 1) {
      logger.error({
        error: new Error('failed to get tabs from storage.'),
        msg: `Failed to get tabs for space with id:  ${spaceId}.`,
        fileTrace: '/services/storage/spaces.ts:34 ~ getTabByIndex()',
      });
      return null;
    }

    return tabs;
  } catch (error) {
    logger.error({
      error: new Error('failed to get tabs from storage.'),
      msg: `Failed to get tabs for space with id:  ${spaceId}.`,
      fileTrace: '/services/storage/spaces.ts:34 ~ getTabByIndex()',
    });
    return null;
  }
};

// get a tab in space by it's index number
export const getTab = async (spaceId: string, idx: number): Promise<ITab | null> => {
  const tabs = await getTabsInSpace(spaceId);

  if (tabs?.length < 1) return null;

  const tab = tabs[idx];

  if (!tab) return null;

  return tab;
};

// update tab index
export const updateTabIndex = async (spaceId: string, oldIndex: number, newIndex: number): Promise<boolean> => {
  // get all tabs from the space
  const tabs = await getTabsInSpace(spaceId);

  if (tabs?.length < 1) return false;

  // remove tab from old index
  const tabToUpdate = tabs.splice(oldIndex, 1);

  // add tab to new index (array mutation)
  tabs.splice(newIndex, 0, tabToUpdate[0]);

  // save new list to storage
  await setStorage({ type: 'sync', key: spaceId, value: tabs });

  return true;
};

// save new tab to space
export const saveNewTab = async (spaceId: string, url: string, title: string, idx: number) => {
  // get all tabs from the space
  const tabs = await getTabsInSpace(spaceId);

  if (tabs?.length < 1) return false;

  const newTab: ITab = {
    url,
    title,
    faviconURL: getFaviconURL(url),
  };

  // add new tab (array mutation)
  tabs.splice(idx, 0, newTab);

  // save new list to storage
  await setStorage({ type: 'sync', key: spaceId, value: tabs });

  return true;
};

// update/save tab url, title, etc
export const updateTab = async (spaceId: string, tab: ITab, idx: number) => {
  // get all tabs from the space
  const tabs = await getTabsInSpace(spaceId);

  // add new tab (array mutation)
  tabs.splice(idx, 0, tab);

  // save new list to storage
  await setStorage({ type: 'sync', key: spaceId, value: tabs });
};

// remove/delete a tab
export const removeTabFromSpace = async (spaceId: string, idx: number, windowId: number, removeFromWindow = false) => {
  // get all tabs from the space
  const tabs = await getTabsInSpace(spaceId);

  if (tabs?.length < 1) return false;

  // remove tab (array mutation)
  const [tabToRemove] = tabs.splice(idx, 1);

  // save new list to storage
  await setStorage({ type: 'sync', key: spaceId, value: tabs });

  // remove tab from window, when deleted from spaces view
  if (removeFromWindow) {
    const tabId = await chrome.tabs.query({ windowId, url: tabToRemove.url, index: idx });
    if (tabId?.length < 1) return;

    await chrome.tabs.remove(tabId[0].id);
  }

  return true;
};
