import { StorageKeys } from '@root/src/constants/app';
import { getStorage } from './helpers/get';
import { ISpace, ISpaceWithoutId, ITab } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';
import { setStorage } from './helpers/set';
import { generateId } from '@root/src/pages/utils/generateId';
import { getTabsInSpace } from './tabs';

// create new space with tabs
export const createNewSpace = async (space: ISpaceWithoutId, tab: ITab[]): Promise<ISpace | null> => {
  try {
    const newSpaceId = generateId();
    const newSpace = { ...space, id: newSpaceId };

    // get all spaces
    const spaces = await getStorage<ISpace[]>({ type: 'local', key: StorageKeys.SPACES });

    // save new space along with others spaces to storage
    await setStorage({
      type: 'local',
      key: StorageKeys.SPACES,
      value: spaces?.length ? [...spaces, newSpace] : [newSpace],
    });

    // create tabs storage for this space
    await setStorage({ type: 'local', key: newSpaceId, value: [...tab] });

    return newSpace;
  } catch (error) {
    logger.error({
      error,
      msg: `Failed to initialize app space data: ${JSON.stringify(space)}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:31 ~ createNewSpace() ~ catch block',
    });
    return null;
  }
};

// create unsaved space
export const createUnsavedSpace = async (windowId: number, tabs: ITab[], activeIndex = 0): Promise<ISpace | null> => {
  try {
    // get all spaces
    const spaces = await getAllSpaces();
    // count number of unsaved tabs, to mark the new unsaved space
    const numOfUnsavedSpaces = spaces?.filter(space => !space.isSaved)?.length || 0;

    const newSpaceId = generateId();

    const newSpace: ISpace = {
      windowId,
      id: newSpaceId,
      title: `Unsaved Space ${numOfUnsavedSpaces + 1}`,
      emoji: '⚠️',
      theme: '#94a3b8',
      isSaved: false,
      activeTabIndex: activeIndex,
    };

    console.log('🚀 ~ file: spaces.ts:59 ~ createUnsavedSpace ~ newSpace:', newSpace);

    // save new space along with others spaces to storage
    await setStorage({
      type: 'local',
      key: StorageKeys.SPACES,
      value: spaces?.length > 0 ? [...spaces, newSpace] : [newSpace],
    });

    // create tabs storage for this space
    await setStorage({ type: 'local', key: newSpaceId, value: [...tabs] });

    return newSpace;
  } catch (error) {
    logger.error({
      error,
      msg: `Failed to create an unsaved space`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:65 ~ createUnsavedSpace() ~ catch block',
    });
    return null;
  }
};

// update a space
export const updateSpace = async (spaceId: string, space: ISpaceWithoutId): Promise<boolean> => {
  try {
    const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'local' });

    let spaceToUpdate = spaces.find(s => s.id === spaceId);
    spaceToUpdate = { ...spaceToUpdate, ...space };

    // save new space along with others spaces to storage
    await setStorage({
      type: 'local',
      key: StorageKeys.SPACES,
      value: [...spaces.filter(s => s.id !== spaceId), spaceToUpdate],
    });
    console.log('🚀 ~ file: spaces.ts:96 ~ updateSpace ~ spaceToUpdate:', spaceToUpdate);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Failed to update space: ${space.title}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:90 ~ updateSpace() ~ catch block',
    });
  }
  return false;
};

// delete a space
export const deleteSpace = async (spaceId: string) => {
  try {
    const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'local' });

    const spaceToDelete = spaces.find(space => space.id === spaceId);

    const newSpaceArray = spaces.filter(space => space.id !== spaceId);

    // save new space list
    await setStorage({ type: 'local', key: StorageKeys.SPACES, value: newSpaceArray });

    // remove saved tabs for this space
    await chrome.storage.local.remove(spaceId);

    if (spaceToDelete?.windowId === 0) return true;

    // close the space window if opened
    const windows = await chrome.windows.getAll();

    if (windows.findIndex(w => w.id === spaceToDelete.windowId) !== -1) {
      await chrome.windows.remove(spaceToDelete.windowId);
    }

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Failed to delete space: ${spaceId}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:127 ~ deleteSpace() ~ catch block',
    });
  }
  return false;
};

// get all spaces
export const getAllSpaces = async () => await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'local' });

// get space by window id
export const getSpaceByWindow = async (windowId: number): Promise<ISpace | null> => {
  try {
    // get all spaces from storage
    const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'local' });

    if (spaces.length < 1) throw new Error('No found spaces in storage.');

    const space = spaces.find(s => s.windowId === windowId);

    if (!space) return null;

    return space;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting space by window windowId: ${windowId}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:157 ~ getSpaceByWindow() ~ catch block',
    });
    return null;
  }
};

// update active tab in space
export const updateActiveTabInSpace = async (windowId: number, idx: number): Promise<ISpace | null> => {
  try {
    // get all spaces from storage
    const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'local' });

    if (spaces.length < 1) throw new Error('No found spaces in storage.');

    // find space to update
    const spaceToUpdate = spaces.find(space => space.windowId === windowId);

    if (!spaceToUpdate) throw new Error('Space not found with this window id.');

    // update active tab index
    spaceToUpdate.activeTabIndex = idx;

    // add the update space along other spaces to new array
    const newSpacesList = spaces.filter(space => space?.windowId !== windowId);

    newSpacesList.push(spaceToUpdate);

    // save spaces to storage
    await setStorage({ type: 'local', key: StorageKeys.SPACES, value: newSpacesList });

    return spaceToUpdate;
  } catch (error) {
    logger.error({
      error,
      msg: `Error updating active tab for window windowId: ${windowId}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:191 ~ updateActiveTabInSpace() ~ catch block',
    });
    return null;
  }
};

// check if new opened window's tabs/urls are a part of space (the space might not have saved this window's id)
export const checkNewWindowTabs = async (windowId: number, urls: string[]): Promise<boolean> => {
  try {
    //get all spaces
    const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'local' });

    if (spaces.length < 1) throw new Error('No spaces found');

    const tabsPromise = spaces.map(space => getTabsInSpace(space.id));

    const promiseRes = await Promise.allSettled(tabsPromise);

    console.log('🚀 ~ file: spaces.ts:212 ~ checkNewWindowTabs ~ promiseRes:', promiseRes);

    //
    let matchedSpace: ISpace | null = null;

    promiseRes.forEach((res, idx) => {
      if (res.status === 'fulfilled') {
        // get all the tab urls from this tab
        const tabURLs = res.value.map(tab => tab.url);

        // compare them
        if (urls.length === tabURLs.length && JSON.stringify(urls) == JSON.stringify(tabURLs)) {
          matchedSpace = spaces[idx];
          return;
        }
      }
    });

    if (!matchedSpace) return false;
    console.log('🚀 ~ file: spaces.ts:248 ~ checkNewWindowTabs ~ matchedSpace:', matchedSpace);

    // tabs in this window is part of a space
    // save windowId to space
    await setStorage({
      type: 'local',
      key: StorageKeys.SPACES,
      value: [...spaces.filter(s => s.id !== matchedSpace.id), { ...matchedSpace, windowId }],
    });

    console.log('🚀 ~ file: spaces.ts:240 ~ checkNewWindowTabs ~ updateSpace:', true);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error checking for space associated with window windowId: ${windowId}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:234 ~ checkNewWindowTabs() ~ catch block',
    });
    return false;
  }
};
