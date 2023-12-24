// create a tab

import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { getTabsInSpace } from '../chrome-storage/tabs';
import { updateSpace } from '../chrome-storage/spaces';
import { getFaviconURL } from '@root/src/pages/utils';

// create a new tab
export const createTab = async (url: string) => {
  await chrome.tabs.create({ active: false, url });
};

type OpenSpaceProps = {
  space: ISpace;
  onNewWindowCreated: (windowId: number) => void;
};

// opens a space in new window
export const openSpace = async ({ space, onNewWindowCreated }: OpenSpaceProps) => {
  //  only active tab will be loaded, rest will be loaded after user visits them

  // create new window with all the space tabs
  const window = await chrome.windows.create({ focused: true });

  if (window.id) {
    // save new window id to space
    await updateSpace(space.id, { ...space, windowId: window.id });
    onNewWindowCreated(window.id);
    const defaultWindowTabId = window.tabs[0].id;
    // get all tabs for space

    const tabs = await getTabsInSpace(space.id);

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

    await Promise.allSettled(createMultipleTabsPromise);

    // create active tab
    await chrome.tabs.create({
      active: true,
      windowId: window.id,
      url: tabs[space.activeTabIndex].url,
      index: space.activeTabIndex,
    });

    // delete the default tab created (an empty tab gets created alone with window)
    await chrome.tabs.remove(defaultWindowTabId);
  }
};

// get current tab
export const getCurrentTab = async (): Promise<ITab> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

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
