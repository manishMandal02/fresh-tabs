import { SampleSpaces } from './../../constants/app';
import { getStorage } from './helpers/get';
import { ISpace, ISpaceWithoutId, ITab } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';
import { setStorage } from './helpers/set';
import { generateId } from '@root/src/pages/utils/generateId';
import { getTabsInSpace, setTabsForSpace } from './tabs';

// create new space with tabs
export const createNewSpace = async (space: ISpaceWithoutId, tabs: ITab[]): Promise<ISpace | null> => {
  try {
    const newSpaceId = generateId();
    const newSpace = { ...space, id: newSpaceId };

    // get all spaces
    const spaces = await getStorage<ISpace[]>({ type: 'sync', key: 'SPACES' });

    // save new space along with others spaces to storage
    await setStorage({
      type: 'sync',
      key: 'SPACES',
      value: spaces?.length ? [...spaces, newSpace] : [newSpace],
    });

    // create tabs storage for this space
    await setTabsForSpace(newSpaceId, [...tabs]);

    return newSpace;
  } catch (error) {
    logger.error({
      error,
      msg: `Failed to initialize app space data: ${JSON.stringify(space)}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:32 ~ createNewSpace() ~ catch block',
    });
    return null;
  }
};

// create unsaved space
export const createUnsavedSpace = async (windowId: number, tabs: ITab[], activeIndex = 0): Promise<ISpace | null> => {
  try {
    // get all spaces
    const spaces = await getAllSpaces();
    // number the new unsaved space after the previous ones
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

    // save new space along with others spaces to storage
    await setStorage({
      type: 'sync',
      key: 'SPACES',
      value: spaces?.length > 0 ? [...spaces, newSpace] : [newSpace],
    });

    // create tabs storage for this space
    await setTabsForSpace(newSpaceId, [...tabs]);

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

export const createSampleSpaces = async () => {
  // create a sample spaces
  await createNewSpace({ ...SampleSpaces[0].space }, [...SampleSpaces[0].tabs]);
  await createNewSpace({ ...SampleSpaces[1].space }, [...SampleSpaces[1].tabs]);
};

// update a space
export const updateSpace = async (spaceId: string, space: ISpaceWithoutId): Promise<boolean> => {
  try {
    const spaces = await getStorage<ISpace[]>({ key: 'SPACES', type: 'sync' });

    let spaceToUpdate = spaces.find(s => s.id === spaceId);
    spaceToUpdate = { ...spaceToUpdate, ...space };

    // save new space along with others spaces to storage
    await setStorage({
      type: 'sync',
      key: 'SPACES',
      value: [...spaces.filter(s => s.id !== spaceId), spaceToUpdate],
    });

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
    const spaces = await getStorage<ISpace[]>({ key: 'SPACES', type: 'sync' });

    const spaceToDelete = spaces.find(space => space.id === spaceId);

    const newSpaceArray = spaces.filter(space => space.id !== spaceId);

    // save new space list
    await setSpacesToStorage(newSpaceArray);

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
export const getAllSpaces = async () => await getStorage<ISpace[]>({ key: 'SPACES', type: 'sync' });

export const setSpacesToStorage = async (space: ISpace[]) => {
  await setStorage({ type: 'sync', key: 'SPACES', value: space });
  return true;
};

// get space by window id
export const getSpaceByWindow = async (windowId: number): Promise<ISpace | null> => {
  try {
    // get all spaces from storage
    const spaces = await getStorage<ISpace[]>({ key: 'SPACES', type: 'sync' });

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
    const spaces = await getStorage<ISpace[]>({ key: 'SPACES', type: 'sync' });

    if (spaces.length < 1) throw new Error('No found spaces in storage.');

    // find space to update
    const spaceToUpdate = spaces.find(space => space.windowId === windowId);

    if (!spaceToUpdate) throw new Error('Space not found with this window id.');

    // update active tab index
    spaceToUpdate.activeTabIndex = idx;

    // add the update space along other spaces to new array
    const newSpacesList = spaces.filter(space => space?.windowId !== windowId);

    newSpacesList.push(spaceToUpdate);

    await setSpacesToStorage(newSpacesList);

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
    const spaces = await getStorage<ISpace[]>({ key: 'SPACES', type: 'sync' });

    if (spaces.length < 1) throw new Error('No spaces found');

    const tabsPromise = spaces.map(space => getTabsInSpace(space.id));

    const promiseRes = await Promise.allSettled(tabsPromise);

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

    // tabs in this window is part of a space
    // save windowId to space
    await setStorage({
      type: 'sync',
      key: 'SPACES',
      value: [...spaces.filter(s => s.id !== matchedSpace.id), { ...matchedSpace, windowId }],
    });

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
