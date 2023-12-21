import { StorageKeys } from '@root/src/constants/app';
import { getStorage } from './helpers/get';
import { ISpace, ISpaceWithoutId, ITab } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';
import { setStorage } from './helpers/set';
import { generateId } from '@root/src/pages/utils/generateId';
import { getTabsInSpace } from './tabs';

// create new space with tabs
export const createNewSpace = async (space: ISpaceWithoutId, tab: ITab[]) => {
  const newSpaceId = generateId();
  const newSpace = { ...space, id: newSpaceId };

  // get all spaces
  const spaces = await getStorage<ISpace[]>({ type: 'sync', key: StorageKeys.SPACES });

  // save new space along with others spaces to storage
  await setStorage({ type: 'sync', key: StorageKeys.SPACES, value: [...spaces, newSpace] });

  // create tabs storage for this space
  await setStorage({ type: 'sync', key: newSpaceId, value: [...tab] });
};

// create unsaved space
export const createUnsavedSpace = async (windowId: number, tabs: ITab[]) => {
  // get all spaces
  const spaces = await getAllSpaces();
  // count number of unsaved tabs, to mark the new unsaved space
  const numOfUnsavedSpaces = spaces.filter(space => !space.isSaved);

  const newSpaceId = generateId();

  const newSpace: ISpace = {
    id: newSpaceId,
    title: `Unsaved Space ${numOfUnsavedSpaces?.length + 1}`,
    emoji: '⚠️',
    theme: '#94a3b8',
    isSaved: false,
    activeTabIndex: 0,
    windowId: windowId,
  };

  // save new space along with others spaces to storage
  await setStorage({ type: 'sync', key: StorageKeys.SPACES, value: [...spaces, newSpace] });

  // create tabs storage for this space
  await setStorage({ type: 'sync', key: newSpaceId, value: [...tabs] });
};

// update a space
export const updateSpace = async (spaceId: string, space: ISpaceWithoutId) => {
  const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'sync' });

  let spaceToUpdate = spaces.find(space => space.id === spaceId);
  spaceToUpdate = { ...spaceToUpdate, ...space };

  // save new space along with others spaces to storage
  await setStorage({
    type: 'sync',
    key: StorageKeys.SPACES,
    value: [...spaces.filter(s => s.id !== spaceId), spaceToUpdate],
  });

  return true;
};

// delete a space
export const deleteSpace = async (spaceId: string) => {
  const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'sync' });

  const spaceToDelete = spaces.find(space => space.id === spaceId);

  const newSpaceArray = spaces.filter(space => space.id !== spaceId);

  // save new space list
  await setStorage({ type: 'sync', key: StorageKeys.SPACES, value: newSpaceArray });

  // remove saved tabs for this space
  await chrome.storage.sync.remove(spaceId);

  // close the space window if opened
  const window = await chrome.windows.get(spaceToDelete.windowId);
  if (window.id) {
    await chrome.windows.remove(window.id);
  }

  return true;
};

// get all spaces
export const getAllSpaces = async () => await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'sync' });

// get space by window id
export const getSpaceByWindow = async (windowId: number): Promise<ISpace | null> => {
  const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'sync' });

  if (spaces.length < 1) {
    logger.error({
      error: new Error('failed to get spaces from storage.'),
      msg: 'Failed to get spaces',
      fileTrace: '/services/storage/spaces.ts:12 ~ getSpaceByWindow()',
    });
    return null;
  }

  const space = spaces.find(space => space.windowId === windowId);

  if (!space) {
    return null;
  }

  return space;
};

// update active tab in space
export const updateActiveTabInSpace = async (windowId: number, idx: number) => {
  const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'sync' });

  if (spaces.length < 1) {
    logger.error({
      error: new Error('failed to get spaces from storage.'),
      msg: 'Failed to get spaces',
      fileTrace: '/services/storage/spaces.ts:12 ~ getSpaceByWindow()',
    });
    return false;
  }

  // find space to update
  const spaceToUpdate = spaces.find(space => space.windowId === windowId);
  // update active tab index
  spaceToUpdate.activeTabIndex = idx;

  // add the update space along other spaces to new array
  const newSpacesList = spaces.filter(space => space.windowId !== windowId);

  newSpacesList.push(spaceToUpdate);

  // save spaces to storage
  await setStorage({ type: 'sync', key: StorageKeys.SPACES, value: newSpacesList });

  return true;
};

// check if new opened window's tabs/urls are a part of space (the space might not have saved this window's id)
export const checkNewWindowTabs = async (windowId: number, urls: string[]) => {
  //get all spaces
  const spaces = await getStorage<ISpace[]>({ key: StorageKeys.SPACES, type: 'sync' });

  const tabsPromise = spaces.map(space => getTabsInSpace(space.id));

  const promiseRes = await Promise.allSettled(tabsPromise);

  //
  let matchedSpace: ISpace | null = null;

  promiseRes.forEach((res, idx) => {
    if (res.status === 'fulfilled') {
      // number of tabs in space
      const numTabs = res.value.length;
      // number of matched urls with this window
      const matchedTabs = res.value.filter(tab => urls.includes(tab.url));
      if (numTabs === matchedTabs.length) {
        matchedSpace = spaces[idx];
      }
    }
  });

  if (matchedSpace) {
    // tabs in this window is part of a space
    // save windowId to space
    await updateSpace(matchedSpace.id, { ...matchedSpace, windowId });
    return true;
  } else {
    return false;
  }
};
