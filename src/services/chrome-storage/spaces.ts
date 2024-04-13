import { SampleSpaces, StorageKey, ThemeColor } from './../../constants/app';
import { getStorage } from './helpers/get';
import { ISpace, ISpaceWithoutId, ITab } from '@root/src/types/global.types';
import { logger } from '@root/src/utils/logger';
import { setStorage } from './helpers/set';
import { generateId } from '@root/src/utils/generateId';
import { getTabsInSpace, setTabsForSpace } from './tabs';

// get all spaces
export const getAllSpaces = async () => await getStorage<ISpace[]>({ key: StorageKey.SPACES, type: 'sync' });

export const setSpacesToStorage = async (spaces: ISpace[]) => {
  await setStorage({ type: 'sync', key: StorageKey.SPACES, value: spaces });
  return true;
};

// create new space with tabs
export const createNewSpace = async (space: ISpaceWithoutId, tabs: ITab[]): Promise<ISpace | null> => {
  try {
    const newSpaceId = generateId();
    const newSpace = { ...space, id: newSpaceId };

    const spaces = await getAllSpaces();

    // save new space along with others spaces to storage
    await setSpacesToStorage(spaces?.length ? [...spaces, newSpace] : [newSpace]);

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
    const spaces = await getAllSpaces();
    // number the new unsaved space after the previous ones
    const numOfUnsavedSpaces = spaces?.filter(space => !space.isSaved)?.length || 0;

    const newSpaceId = generateId();

    const newSpace: ISpace = {
      windowId,
      id: newSpaceId,
      title: `Unsaved Space ${numOfUnsavedSpaces + 1}`,
      emoji: '⚠️',
      theme: ThemeColor.Grey,
      isSaved: false,
      activeTabIndex: activeIndex,
    };

    // save new space along with others spaces to storage
    await setSpacesToStorage(spaces?.length > 0 ? [...spaces, newSpace] : [newSpace]);

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
  for (const spaceWithTabs of SampleSpaces) {
    const { tabs, ...space } = spaceWithTabs;
    await createNewSpace(space, tabs);
  }
};

// update a space
export const updateSpace = async (spaceId: string, space: Partial<ISpaceWithoutId>): Promise<boolean> => {
  try {
    const spaces = await getAllSpaces();

    const spaceToUpdateIndex = spaces.findIndex(s => s.id === spaceId);
    let spaceToUpdate = spaces.find(s => s.id === spaceId);
    spaceToUpdate = { ...spaceToUpdate, ...space };

    const newSpaces = spaces.toSpliced(spaceToUpdateIndex, 1, spaceToUpdate);

    // save new space along with others spaces to storage
    await setSpacesToStorage(newSpaces);

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
    const spaces = await getAllSpaces();

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

// get space by window id
export const getSpaceByWindow = async (windowId: number): Promise<ISpace | null> => {
  try {
    // get all spaces from storage
    const spaces = await getAllSpaces();

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

// get space by window id
export const getSpace = async (id: string): Promise<ISpace | null> => {
  try {
    // get all spaces from storage
    const spaces = await getAllSpaces();

    if (spaces.length < 1) throw new Error('No found spaces in storage.');

    return spaces.find(s => s.id === id) || null;
  } catch (error) {
    logger.error({
      error,
      msg: `Error getting space by id: ${id}`,
      fileTrace: 'src/services/chrome-storage/spaces.ts:157 ~ getSpace() ~ catch block',
    });
    return null;
  }
};

// update active tab in space
export const updateActiveTabInSpace = async (windowId: number, idx: number): Promise<ISpace | null> => {
  try {
    // get all spaces from storage
    const spaces = await getAllSpaces();

    if (spaces.length < 1) throw new Error('No found spaces in storage.');

    // find space to update
    const spaceToUpdateIndex = spaces.findIndex(s => s.windowId === windowId);

    const spaceToUpdate = spaces.find(space => space.windowId === windowId);

    if (!spaceToUpdate) throw new Error('Space not found with this window id.');

    // update active tab index
    spaceToUpdate.activeTabIndex = idx;

    // replace the updated space
    const newSpaces = spaces.toSpliced(spaceToUpdateIndex, 1, spaceToUpdate);

    await setSpacesToStorage(newSpaces);

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
    const spaces = await getAllSpaces();

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
    await setSpacesToStorage([...spaces.filter(s => s.id !== matchedSpace.id), { ...matchedSpace, windowId }]);

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
