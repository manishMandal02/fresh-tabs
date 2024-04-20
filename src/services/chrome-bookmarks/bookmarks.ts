// chrome bookmarks helpers

import { FRESH_TABS_BOOKMARK_TITLE, StorageKey } from '@root/src/constants/app';
import { generateBMTitle, getSpaceInfoFromBMTitle } from './bookmark-title';
import { ISpace, ITab } from '@root/src/types/global.types';
import { logger } from '@root/src/utils/logger';
import { getStorage } from '../chrome-storage/helpers';
import { getAllSpaces, setSpacesToStorage } from '../chrome-storage/spaces';
import { setTabsForSpace } from '../chrome-storage/tabs';

// check if parent bookmark folder exists
export const checkParentBMFolder = async () => {
  const bmSearch = await chrome.bookmarks.search({ title: FRESH_TABS_BOOKMARK_TITLE });

  //  folder not found
  if (bmSearch.length < 1) return '';

  const appBMParent = bmSearch.find(bm => bm.title === FRESH_TABS_BOOKMARK_TITLE);

  // parent folder not found
  if (!appBMParent.id) return '';

  // folder found
  return appBMParent.id;
};

// create app's parent/root bookmark folder to save all the spaces
const createParentBMFolder = async () => {
  try {
    const bmFolder = await chrome.bookmarks.create({ title: FRESH_TABS_BOOKMARK_TITLE });

    if (!bmFolder.id) throw new Error('Error creating parent bookmark folder');

    return bmFolder.id;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error creating bookmark parent id.',
      fileTrace: 'src/services/chrome-storage/bookmarks.ts:39 ~ createParentBMFolder() ~ catch block',
    });
    return null;
  }
};

// get parent/root bookmark folder
export const getParentBMId = async () => {
  // search book to find find app's root bm folder
  const parentBMId = await checkParentBMFolder();

  // folder not found, create one
  if (!parentBMId) return createParentBMFolder();

  return parentBMId;
};

// sync/save spaces  from bookmarks to storage
export const syncSpacesFromBookmarks = async (rootFolderId: string) => {
  try {
    // spaces bookmark folder
    const rootBMFolder = await chrome.bookmarks.getSubTree(rootFolderId);

    if (rootBMFolder.length < 1) return [];

    const spaces: ISpace[] = [];

    // promises tabs to be saved to storage
    const saveTabsPromises: Promise<boolean>[] = [];

    for (const spaceBMFolder of rootBMFolder[0].children) {
      const spaceBM = spaceBMFolder.children;

      // there's only 1 folder inside a space folder,  who's title contains info about that space
      const spaceInfoBM = spaceBM.find(child => !child.url);

      const space = getSpaceInfoFromBMTitle(spaceInfoBM.title);

      const tabsBM = spaceBM.filter(tabBM => tabBM.id !== spaceInfoBM.id);

      const tabs: ITab[] = [];

      for (const tabBM of tabsBM) {
        tabs.push({ id: 0, title: tabBM.title, url: tabBM.url, index: tabBM.index });
      }

      spaces.push(space);

      saveTabsPromises.push(setTabsForSpace(space.id, tabs));
    }

    // get current spaces from storage
    const allSpaces = await getAllSpaces();

    // save all spaces to storage
    await setSpacesToStorage([...(allSpaces || []), ...spaces]);

    // save all tabs
    await Promise.allSettled(saveTabsPromises);

    return [...(allSpaces || []), ...spaces];
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting spaces from bookmarks',
      fileTrace: 'src/services/chrome-storage/bookmarks.ts:91 ~ getSpacesFromBookmarks() ~ catch block',
    });
    return [];
  }
};

// sync/save spaces from storage bookmarks
export const syncSpacesToBookmark = async () => {
  try {
    const parentBMId = await getParentBMId();

    // remove the previous app's parent bm folder
    await chrome.bookmarks.removeTree(parentBMId);

    // create new parent bm folder
    const newParentBMFolderId = await createParentBMFolder();

    // get spaces and tabs
    const spaces = await getAllSpaces();

    // add spaces folder to parent folder
    for (const space of spaces) {
      // don't save unsaved spaces to bookmarks
      if (!space.isSaved) continue;

      // create space bookmark folder
      const spaceBMFolder = await chrome.bookmarks.create({ title: space.title, parentId: newParentBMFolderId });

      // create an empty folder space folder
      // this folder's title contains all the details of that space
      const spaceDetailsStr = generateBMTitle(space);

      // get all tabs for this space
      const tabs = await getStorage<ITab[]>({ type: 'local', key: StorageKey.tabs(space.id) });

      // group all tab promises to process at once
      const tabsPromises: Promise<chrome.bookmarks.BookmarkTreeNode>[] = [];

      tabsPromises.push(chrome.bookmarks.create({ parentId: spaceBMFolder.id, title: spaceDetailsStr, index: 0 }));

      tabs.forEach((tab, idx) => {
        tabsPromises.push(
          chrome.bookmarks.create({ parentId: spaceBMFolder.id, title: tab.title, url: tab.url, index: idx + 1 }),
        );
      });

      // create tabs bookmarks in space folder
      await Promise.allSettled(tabsPromises);
    }
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error saving spaces to bookmarks',
      fileTrace: 'src/services/chrome-storage/bookmarks.ts:140 ~ saveSpacesToBookmark() ~ catch block',
    });
    return false;
  }
};
