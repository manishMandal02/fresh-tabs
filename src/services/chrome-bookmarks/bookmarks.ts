// chrome bookmarks helpers

import { FRESH_TABS_BOOKMARK_TITLE } from '@root/src/constants/app';
import { getSpaceInfoFromBMTitle } from './bookmarkTitle';
import { ISpaceWithTabs, ITab } from '@root/src/pages/types/global.types';
import { logger } from '@root/src/pages/utils/logger';

export const getParentBMId = () => {};

// get all tabs from bookmarks by space id
export const getSpacesFromBookmarks = async () => {
  try {
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

export const saveSpacesToBookmark = (spaces: ISpaceWithTabs[]) => {
  const createSpacesBMPromises = [];

  // for (const space of spaces) {}

  spaces.forEach(space => {
    chrome.bookmarks.create({
      title: space.title,
      parentId: FRESH_TABS_BOOKMARK_TITLE,
    });
  });

  return createSpacesBMPromises;
};
