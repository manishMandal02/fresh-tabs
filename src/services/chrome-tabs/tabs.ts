// create a tab

import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { getTabsInSpace } from '../chrome-storage/tabs';
import { updateSpace } from '../chrome-storage/spaces';
import { getFaviconURL } from '@root/src/pages/utils';

type OpenSpaceProps = {
  space: ISpace;
  onNewWindowCreated: (windowId: number) => void;
  shouldOpenInNewWindow: boolean;
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

const openSpaceInSameWindow = async (space: ISpace, tabs: ITab[]) => {
  const currentWindowId = await getCurrentWindowId();
  // delete all the tabs in the current window
  const tabsToBeDeletedPromises: Promise<void>[] = [];
  // get all tabs inm this window
  const currentWindowTabs = await chrome.tabs.query({ windowId: space.windowId });

  for (const tab of currentWindowTabs) {
    tabsToBeDeletedPromises.push(chrome.tabs.remove(tab.id));
  }

  // create tabs for the opened space
  const tabsToBeCreatedPromises: Promise<chrome.tabs.Tab>[] = [];

  tabs.forEach((tab, idx) => {
    tabsToBeCreatedPromises.push(
      chrome.tabs.create({ url: tab.url, windowId: currentWindowId, index: idx, active: space.activeTabIndex === idx }),
    );
  });

  //TODO - make sure the window doesn't close

  // delete all tabs
  await Promise.allSettled(tabsToBeDeletedPromises);

  // create new tabs
  await Promise.allSettled(tabsToBeCreatedPromises);

  // save new window id to space
  await updateSpace(space.id, { ...space, windowId: currentWindowId });
};

// opens a space in new window
export const openSpace = async ({ space, onNewWindowCreated, shouldOpenInNewWindow }: OpenSpaceProps) => {
  //* only active tab will be loaded, rest will be loaded after user visits them

  if (!shouldOpenInNewWindow) {
    openSpaceInSameWindow(space, []);
  }
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

    await createDiscardedTabs(discardedTabs, window.id);

    // create active tab
    await chrome.tabs.create({
      active: true,
      windowId: window.id,
      url: tabs[space.activeTabIndex].url,
      index: space.activeTabIndex,
    });

    // delete the default tab created (an empty tab gets created along with window)
    await chrome.tabs.remove(defaultWindowTabId);
  }
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
