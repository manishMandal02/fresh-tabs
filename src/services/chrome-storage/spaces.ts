import { StorageKeys } from '@root/src/constants/app';
import { getStorage } from './helpers/get';
import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';
import { setStorage } from './helpers/set';
import { generateId } from '@root/src/pages/utils/generateId';

type ISpaceWithoutId = Omit<ISpace, 'id'>;

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
