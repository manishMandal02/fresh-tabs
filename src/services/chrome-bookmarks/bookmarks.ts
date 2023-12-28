// chrome bookmarks helpers

import { FRESH_TABS_BOOKMARK_TITLE } from '@root/src/constants/app';
import { generateBMTitle, getSpaceInfoFromBMTitle } from './bookmarkTitle';
import { ISpaceWithTabs, ITab } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';
import { getStorage } from '../chrome-storage/helpers/get';
import { setStorage } from '../chrome-storage/helpers/set';

// check for parent bookmark folder
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
// create parent bookmark folder
const createParentBMFolder = async () => {
  try {
    const bmFolder = await chrome.bookmarks.create({ title: FRESH_TABS_BOOKMARK_TITLE });

    if (!bmFolder.id) throw new Error('Error creating parent bookmark folder');

    await setStorage({ type: 'sync', key: 'BOOKMARK_ID', value: bmFolder.id });

    return bmFolder.id;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error creating bookmark parent id.',
      fileTrace: 'src/services/chrome-storage/bookmarks.ts:26 ~ createParentBMFolder() ~ catch block',
    });
    return null;
  }
};

// get app's parent bm folder
export const getParentBMId = async () => {
  const id = await getStorage<string>({ type: 'sync', key: 'BOOKMARK_ID' });

  if (id) return id;

  const parentBMId = await checkParentBMFolder();

  // parent bm found
  await setStorage({ type: 'sync', key: 'BOOKMARK_ID', value: parentBMId });
  return parentBMId;
};

// get all tabs from bookmarks by space id
export const getSpacesFromBookmarks = async () => {
  try {
    // spaces bookmark folder
    const spacesBM = await chrome.bookmarks.search({ title: FRESH_TABS_BOOKMARK_TITLE });

    if (spacesBM.length < 1) return null;

    const spaces: ISpaceWithTabs[] = [];

    for (const bookmark of spacesBM) {
      const spaceBM = await chrome.bookmarks.getChildren(bookmark.id);
      // only 1 folder inside a space bookmark who's title contains info about that space
      const spaceInfoBM = spaceBM.find(child => !child.url);

      const space = getSpaceInfoFromBMTitle(spaceInfoBM.title);

      const tabsBM = spaceBM.filter(tabBM => tabBM.id !== spaceInfoBM.id);

      const tabs: ITab[] = [];

      for (const tabBM of tabsBM) {
        tabs[tabBM.index] = { id: 0, title: tabBM.title, url: tabBM.url };
      }

      spaces.push({ ...space, tabs });
    }

    return spaces;
  } catch (error) {
    logger.error({
      error,
      msg: 'Error getting spaces from bookmarks',
      fileTrace: 'src/services/chrome-storage/bookmarks.ts:40 ~ getSpacesFromBookmarks() ~ catch block',
    });
    return null;
  }
};

// save spaces with tabs to app's parent bookmark folder
export const saveSpacesToBookmark = async (spaces: ISpaceWithTabs[]) => {
  try {
    const parentBMId = await getParentBMId();

    // remove the previous app's parent bm folder
    await chrome.bookmarks.removeTree(parentBMId);

    // create new parent bm folder
    const newParentBMFolderId = await createParentBMFolder();

    // add spaces folder to parent folder
    for (const space of spaces) {
      // don't save unsaved spaces to bookmarks
      if (!space.isSaved) continue;

      // create space bookmark folder
      const spaceBMFolder = await chrome.bookmarks.create({ title: space.title, parentId: newParentBMFolderId });

      // group all tab promises to process at once
      const tabsPromises: Promise<chrome.bookmarks.BookmarkTreeNode>[] = [];

      // create an empty folder space folder
      // this folder's title contains all the details of that space
      const spaceDetailsStr = generateBMTitle(space);

      tabsPromises.push(chrome.bookmarks.create({ parentId: spaceBMFolder.id, title: spaceDetailsStr, index: 0 }));

      space.tabs.forEach((tab, idx) => {
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
      fileTrace: 'src/services/chrome-storage/bookmarks.ts:0 ~ saveSpacesToBookmark() ~ catch block',
    });
    return false;
  }
};
