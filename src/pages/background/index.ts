import { SampleSpace, StorageKeys } from './../../constants/app';
import { ITab } from './../types/global.types';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { getUrlFromHTML } from '../utils/get-url-from-html';
import {
  checkNewWindowTabs,
  createNewSpace,
  createUnsavedSpace,
  deleteSpace,
  getSpaceByWindow,
  updateActiveTabInSpace,
} from '@root/src/services/chrome-storage/spaces';
import { removeTabFromSpace, updateTab, updateTabIndex } from '@root/src/services/chrome-storage/tabs';
import { getFaviconURL, wait } from '../utils';
import { logger } from '../utils/logger';
import { setStorage } from '@root/src/services/chrome-storage/helpers/set';
import { publishEvents } from '../utils/publishEvents';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

logger.info('🏁 background loaded');

// open side panel on extension icon clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => {
  logger.error({
    error,
    msg: `Error at ~ chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }) `,
    fileTrace: 'src/pages/background/index.ts:35 ~ chrome.sidePanel.setPanelBehavior()',
  });
});

const createSpacesOnInstall = async (shouldCreateSampleSpace = false) => {
  try {
    const windows = await chrome.windows.getAll();

    for (const window of windows) {
      // get all tabs in the window
      const tabsInWindow = await chrome.tabs.query({ windowId: window.id });

      if (tabsInWindow?.length < 1) throw new Error('No tabs found in window');

      const tabs: ITab[] = tabsInWindow.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        faviconURL: getFaviconURL(tab.url),
      }));

      // active tab for window
      const activeIndex = tabsInWindow.find(tab => tab.active).index || 0;

      // create space
      await createUnsavedSpace(window.id, tabs, activeIndex);
    }

    // create a sample space for new users
    if (shouldCreateSampleSpace) {
      await createNewSpace({ ...SampleSpace.space }, [...SampleSpace.tabs]);
    }

    // success
    return true;
  } catch (error) {
    logger.error({
      error: new Error('Failed to create spaces'),
      msg: 'Failed to initialize app',
      fileTrace: 'src/pages/background/index.ts:59 ~ createSpacesOnInstall() ~ catch block',
    });
    return false;
  }
};

// on extension installed
chrome.runtime.onInstalled.addListener(async info => {
  if (info.reason === 'install') {
    // initialize the app

    // initialize storage
    await setStorage({ type: 'local', key: StorageKeys.SPACES, value: [] });

    // create unsaved spaces for current opened windows and sample space if new user
    await createSpacesOnInstall(true);

    logger.info('✅ Successfully initialized app.');
  }
});

// shortcut key to open fresh-tabs side panel: CMD+E (CTRL+E)
chrome.commands.onCommand.addListener(async (_command, tab) => {
  await chrome.sidePanel.open({ windowId: tab.windowId });
});

// When the new tab is selected, get the link in the title and load the page
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  //
  const splitText = 'data:text/html,';

  // get tab info
  const tab = await chrome.tabs.get(tabId);

  // update tab with original link if it was discarded
  if (tab.url.startsWith(splitText)) {
    // get url from html in the url
    const url = getUrlFromHTML(tab.url.replace(splitText, ''));

    // update tab with original url
    await chrome.tabs.update(tabId, {
      url,
    });
  }

  // wait for 1s
  await wait(1000);

  // update spaces' active tab
  const updateSpace = await updateActiveTabInSpace(windowId, tab.index);

  // send send to side panel
  await publishEvents({
    event: 'UPDATE_SPACE_ACTIVE_TAB',
    payload: {
      spaceId: updateSpace.id,
      newActiveIndex: updateSpace.activeTabIndex,
    },
  });
});

// event listener for when tabs get updated
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info?.status === 'complete') {
    // get tab info
    const tab = await chrome.tabs.get(tabId);

    // wait 0.2s for better processing when opened new space with lot of tabs
    // await wait(200);

    // get space by windowId
    const space = await getSpaceByWindow(tab.windowId);

    console.log('🚀 ~ file: index.ts:145 ~ chrome.tabs.onUpdated.addListener ~ space:', space);

    if (!space?.id) return;

    //  create new  or update tab
    const updatedTab = await updateTab(
      space?.id,
      { id: tab.id, url: tab.url, title: tab.title, faviconURL: getFaviconURL(tab.url) },
      tab.index,
    );

    // send send to side panel
    await publishEvents({
      event: 'UPDATE_TAB',
      payload: {
        spaceId: space.id,
        tab: updatedTab,
      },
    });
  }
});

// event listener for when tabs get moved (index change)
chrome.tabs.onMoved.addListener(async (_tabId, info) => {
  // get space by windowId
  const space = await getSpaceByWindow(info.windowId);

  // update tab index
  await updateTabIndex(space.id, info.fromIndex, info.toIndex);

  // send send to side panel
  await publishEvents({
    event: 'UPDATE_TABS',
    payload: {
      spaceId: space.id,
    },
  });
});

// event listener for when tabs get removed
chrome.tabs.onRemoved.addListener(async (tabId, info) => {
  // do nothing if tab removed because window was closed
  if (info.isWindowClosing) return;

  // get space by windowId
  const space = await getSpaceByWindow(info.windowId);

  // remove tab
  await removeTabFromSpace(space, tabId);

  // send send to side panel
  await publishEvents({
    event: 'REMOVE_TAB',
    payload: {
      spaceId: space.id,
      tabId: tabId,
    },
  });
});

// window created/opened
chrome.windows.onCreated.addListener(async window => {
  // wait for 1s
  await wait(1000);

  // get space by window
  const space = await getSpaceByWindow(window.id);

  // if this window is associated with a space then do nothing
  if (space?.id) return;

  // create new unsaved space if only 1 tab created with the window
  if (window.tabs.length === 1) {
    // tab to be added in space
    const tab: ITab = {
      id: window.tabs[0].id,
      url: window.tabs[0].url,
      title: window.tabs[0].title,
      faviconURL: getFaviconURL(window.tabs[0].url),
    };
    const newSpace = await createUnsavedSpace(window.id, [tab]);

    // send send to side panel
    await publishEvents({
      event: 'ADD_SPACE',
      payload: {
        space: { ...newSpace, tabs: [tab] },
      },
    });
    return;
  }

  // check if the tabs in this window are of a space (check tab urls)
  const res = await checkNewWindowTabs(window.id, [...window.tabs.map(tab => tab.url)]);
  // if the tabs in this window are part of a space, do nothing
  // window id was saved to the respective space
  if (res) return;

  // if not then create new unsaved space with all tabs

  // get all tabs in the window
  const tabs: ITab[] = window.tabs.map(tab => ({
    id: tab.id,
    title: tab.title,
    url: tab.url,
    faviconURL: getFaviconURL(tab.url),
  }));

  // create space
  const newSpace = await createUnsavedSpace(window.id, tabs);

  // send send to side panel
  await publishEvents({
    event: 'ADD_SPACE',
    payload: {
      space: newSpace,
    },
  });
});

// window removed/closed
chrome.windows.onRemoved.addListener(async windowId => {
  // get space by window
  const space = await getSpaceByWindow(windowId);

  // if the space was not saved, then delete
  if (!space.isSaved) {
    await deleteSpace(space.id);

    // send send to side panel
    await publishEvents({
      event: 'REMOVE_SPACE',
      payload: {
        spaceId: space.id,
      },
    });
  }
});
