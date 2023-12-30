// create a tab

import { IAppSettings, ISpace, ITab } from '@root/src/pages/types/global.types';
import { getSpaceByWindow, updateSpace } from '../chrome-storage/spaces';
import { getFaviconURL } from '@root/src/pages/utils';

type OpenSpaceProps = {
  space: ISpace;
  tabs: ITab[];
  onNewWindowCreated: (windowId: number) => void;
  openWindowType: IAppSettings['openSpace'];
};

const createActiveTab = async (url: string, index: number, windowId) => {
  return await chrome.tabs.create({
    windowId,
    url,
    index,
    active: true,
  });
};

const createDiscardedTabs = async (tabs: ITab[], windowId: number) => {
  //  set html for discard tabs so they load only after visited by user
  const discardedTabHTML = (tab: ITab) => `
      <!DOCTYPE html>
      <html>
      <head>
      <link rel="icon" href="${getFaviconURL(tab.url)}">
      <title>${tab.title}</title>
      <link href="//{[${tab.url}]}//">
      </head>
      <body>
      </body>
      </html>`;

  // batch all the promise to process at once (create's discarded tabs)
  const createMultipleTabsPromise = tabs.map((tab, index) =>
    chrome.tabs.create({
      windowId,
      index,
      active: false,
      url: `data:text/html,${encodeURIComponent(discardedTabHTML(tab))}`,
    }),
  );

  await Promise.allSettled(createMultipleTabsPromise);
};

const clearCurrentWindow = async () => {
  //
  const currentWindowId = await getCurrentWindowId();

  // batch tabs to delete promises
  const tabsToBeDeletedPromises: Promise<void>[] = [];

  // temporary create an empty tab in this window
  const defaultWindowTabId = await chrome.tabs.create({
    active: true,
    url: 'chrome://newtab/',
    index: 0,
    windowId: currentWindowId,
  });

  // get all tabs in this window
  const currentWindowTabs = await chrome.tabs.query({ windowId: currentWindowId });

  for (const tab of currentWindowTabs) {
    tabsToBeDeletedPromises.push(chrome.tabs.remove(tab.id));
  }

  // delete all the tabs in the current window
  await Promise.allSettled(tabsToBeDeletedPromises);

  return { defaultWindowTabId: defaultWindowTabId.id, windowId: currentWindowId };
};

// opens a space in new window
export const openSpace = async ({ space, tabs, onNewWindowCreated, openWindowType }: OpenSpaceProps) => {
  // only active tab will be loaded, rest will be loaded after user visits them

  // space's active tab position
  const activeTabIndex = space.activeTabIndex;

  const activeTabUrl = tabs[activeTabIndex].url;

  const discardedTabs = tabs.filter((_tab, idx) => idx !== activeTabIndex);

  let windowId = 0;

  let defaultWindowTabId = 0;

  // get the window based on user preference
  if (openWindowType === 'sameWindow') {
    // clear the current window
    const res = await clearCurrentWindow(tabs);
    windowId = res.windowId;
    defaultWindowTabId = res.defaultWindowTabId;

    // remove this window id from the current space
    const currentSpace = await getSpaceByWindow(windowId);

    await updateSpace(currentSpace.id, { ...currentSpace, windowId: 0 });
  } else {
    // create new window
    const window = await chrome.windows.create({ focused: true });

    if (window) {
      windowId = window.id;
      defaultWindowTabId = window.tabs[0].id;
    }
  }

  if (!windowId) return;
  // set current window in side panel UI
  onNewWindowCreated(windowId);

  // save new window id to space
  await updateSpace(space.id, { ...space, windowId });

  //  discarded tabs
  await createDiscardedTabs(discardedTabs, windowId);

  // create active tab
  await createActiveTab(activeTabUrl, activeTabIndex, windowId);

  // delete the default tab created (an empty tab gets created along with window)
  await chrome.tabs.remove(defaultWindowTabId);
};

// create a new tab
export const createTab = async (url: string) => {
  await chrome.tabs.create({ active: false, url });
};

// go to tab
export const goToTab = async (id: number) => {
  await chrome.tabs.update(id, { active: true });
};

// get current tab
export const getCurrentTab = async (): Promise<ITab> => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) return null;

  return {
    id: tab.id,
    title: tab.title,
    url: tab.url,
  };
};

// get current window id
export const getCurrentWindowId = async () => {
  const { id } = await chrome.windows.getCurrent();
  if (!id) return null;
  return id;
};
