// create a tab

import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { getTabsInSpace } from '../chrome-storage/tabs';
import { updateSpace } from '../chrome-storage/spaces';
import { getFaviconURL } from '@root/src/pages/utils';

// create a new tab
export const createTab = async (url: string) => {
  await chrome.tabs.create({ active: false, url });
};

// opens a space in new window
export const openSpace = async (space: ISpace) => {
  //  only active tab will be loaded, rest will be loaded after user visits them

  // create new window with all the space tabs
  const window = await chrome.windows.create({ focused: true });

  if (window.id) {
    const defaultWindowTabId = window.tabs[0].id;
    // get all tabs for space

    const tabs = await getTabsInSpace(space.id);

    console.log('🚀 ~ file: tabs.ts:25 ~ openSpace ~ tabs:', tabs);

    // create discarded tabs
    const discardedTabs = tabs.filter((tab, idx) => idx !== space.activeTabIndex);

    //  set html for discard tabs so they load only after visited by user
    const discardedTabHTML = (tab: ITab) => `
    <!DOCTYPE html>
    <html>
    <head>
    <link rel="icon" href="${tab.faviconURL}">
    <title>${tab.title}</title>
    <link href="//{[${tab.url}]}//">
    </head>
    <body>
    </body>
    </html>`;

    // batch all the promise to process at once (create's discarded tabs)
    const createMultipleTabsPromise = discardedTabs.map((tab, idx) =>
      chrome.tabs.create({
        active: false,
        windowId: window.id,
        index: idx,
        url: `data:text/html,${encodeURIComponent(discardedTabHTML(tab))}`,
      }),
    );

    console.log('🚀 ~ file: tabs.ts:51 ~ openSpace ~ discardedTabs:', discardedTabs);

    const res = await Promise.allSettled(createMultipleTabsPromise);

    console.log('🚀 ~ file: tabs.ts:57 ~ openSpace ~ res:', res);

    // create active tab
    await chrome.tabs.create({
      active: true,
      windowId: window.id,
      url: tabs[space.activeTabIndex].url,
      index: space.activeTabIndex,
    });

    // save new window id to space
    await updateSpace(space.id, { ...space, windowId: window.id });

    // delete the default tab created (an empty tab gets created alone with window)
    await chrome.tabs.remove(defaultWindowTabId);
  }
};

// get current tab
export const getCurrentTab = async (): Promise<ITab> => {
  // const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = await chrome.tabs.getCurrent();

  console.log('🚀 ~ file: tabs.ts:69 ~ getCurrentTab ~ tab:', tab);

  if (!tab?.id) return null;

  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
    faviconURL: getFaviconURL(tab.url),
  };
};

// get current window id
export const getCurrentWindowId = async () => {
  const { id } = await chrome.windows.getCurrent();
  if (!id) return null;
  return id;
};
