// create a tab

import { IAppSettings, ISpace, ITab } from '@root/src/pages/types/global.types';
import { getSpaceByWindow, updateSpace } from '../chrome-storage/spaces';
import { getFaviconURL } from '@root/src/pages/utils';
import { getTabsInSpace, setTabsForSpace } from '../chrome-storage/tabs';
import { DiscardTabURLPrefix } from '@root/src/constants/app';
import { getUrlFromHTML } from '@root/src/pages/utils/get-url-from-html';

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

// creates a html url tabs that doesn't load tab until user visits them
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

  const responses = await Promise.allSettled(createMultipleTabsPromise);

  const createdTabs: ITab[] = [];

  for (const res of responses) {
    if (res.status === 'rejected') return;
    const tab = res.value;
    createdTabs.push({ id: tab.id, url: getUrlFromHTML(tab.url.replace(DiscardTabURLPrefix, '')), title: tab.title });
  }
  console.log('🚀 ~ file: tabs.ts:60 ~ createDiscardedTabs ~ createdTabs:', createdTabs);

  return createdTabs;
};

// removes all tabs in the current window, also creates a temporary new tab
const clearCurrentWindow = async (windowId: number) => {
  // batch tabs to delete promises
  const tabsToBeDeletedPromises: Promise<void>[] = [];

  // get all non-active tabs in this window
  const currentWindowTabs = await chrome.tabs.query({ windowId, active: false });

  console.log('🚀 ~ file: tabs.ts:72 ~ clearCurrentWindow ~ currentWindowTabs:', currentWindowTabs);

  for (const tab of currentWindowTabs) {
    tabsToBeDeletedPromises.push(chrome.tabs.remove(tab.id));
  }

  // delete all the tabs in the current window
  await Promise.allSettled(tabsToBeDeletedPromises);
};

// opens a space in new window
export const openSpace = async ({ space, tabs, onNewWindowCreated, openWindowType }: OpenSpaceProps) => {
  // only active tab will be loaded, rest will be loaded after user visits them

  // space's active tab position
  const activeTabIndex = space.activeTabIndex;

  const activeTabUrl = tabs[activeTabIndex]?.url || 'chrome://newtab';

  const discardedTabsToCreate = tabs.filter((_tab, idx) => idx !== activeTabIndex);

  let windowId = 0;

  let defaultWindowTabId = 0;

  // for same-window method only
  // storing the tabs of the current (previous) space to add them back after the window is cleared for new space
  const currentSpaceInfo: { id: string; tabs: ITab[] } = {
    id: '',
    tabs: [],
  };

  // get the window based on user preference
  if (openWindowType === 'sameWindow') {
    const currentWindowId = await getCurrentWindowId();

    const currentSpace = await getSpaceByWindow(currentWindowId);
    // tabs in space before clearing
    const tabsInSpaceBefore = await getTabsInSpace(currentSpace.id);

    currentSpaceInfo.id = currentSpace.id;
    currentSpaceInfo.tabs = tabsInSpaceBefore;

    // clear the current window
    await clearCurrentWindow(currentWindowId);
    // set window id
    windowId = currentWindowId;
    // set default tab id
    defaultWindowTabId = tabsInSpaceBefore[currentSpace.activeTabIndex].id;

    // remove this window id from the current space
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

  // save new window id to space
  await updateSpace(space.id, { ...space, windowId });

  // set current window in side panel UI
  onNewWindowCreated(windowId);

  //  discarded tabs
  const discardTabs = await createDiscardedTabs(discardedTabsToCreate, windowId);

  // create active tab
  const activeTab = await createActiveTab(activeTabUrl, activeTabIndex, windowId);

  const updatedTabs = [...discardTabs];

  // add active tab at its index
  updatedTabs.splice(activeTabIndex, 0, { url: activeTab.url, id: activeTab.id, title: activeTab.title });

  console.log('🚀 ~ file: tabs.ts:154 ~ openSpace ~ updatedTabs:', updatedTabs);

  // set tabs with new ids
  await setTabsForSpace(space.id, updatedTabs);

  // delete the default tab created (an empty tab gets created along with window)
  const removedDefaultTab = await chrome.tabs.remove(defaultWindowTabId);

  console.log('🚀 ~ file: tabs.ts:159 ~ openSpace ~ removedDefaultTab:', removedDefaultTab);

  // making sure the deleted tabs are not removed from space
  await setTabsForSpace(currentSpaceInfo.id, currentSpaceInfo.tabs);
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
