import { SampleSpaces } from './../../constants/app';
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
import { publishEvents } from '../utils/publish-events';
import { generateId } from '../utils/generateId';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

logger.info('🏁 background loaded');

const DiscardTabURLPrefix = 'data:text/html,';

// open side panel on extension icon clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => {
  logger.error({
    error,
    msg: `Error at ~ chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }) `,
    fileTrace: 'src/pages/background/index.ts:35 ~ chrome.sidePanel.setPanelBehavior()',
  });
});

// TODO - check for BM tabs storage

//* common event handlers

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
      await createNewSpace({ ...SampleSpaces[0].space }, [...SampleSpaces[0].tabs]);
      await createNewSpace({ ...SampleSpaces[1].space }, [...SampleSpaces[1].tabs]);
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

const updateTabHandler = async (tabId: number) => {
  const tab = await chrome.tabs.get(tabId);

  if (tab?.url.startsWith(DiscardTabURLPrefix)) return;
  // wait 0.2s for better processing when opened new space with lot of tabs
  // await wait(200);

  // get space by windowId
  const space = await getSpaceByWindow(tab.windowId);

  if (!space?.id) return;

  //  create new  or update tab
  await updateTab(space?.id, { id: tab.id, url: tab.url, title: tab.title }, tab.index);

  // send send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_TABS',
    payload: {
      spaceId: space.id,
    },
  });
};

const removeTabHandler = async (tabId: number, windowId: number) => {
  // get space by windowId
  const space = await getSpaceByWindow(windowId);

  // remove tab
  await removeTabFromSpace(space, tabId);

  // send send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_TABS',
    payload: {
      spaceId: space?.id,
    },
  });
};

// on extension installed
chrome.runtime.onInstalled.addListener(async info => {
  if (info.reason === 'install') {
    // initialize the app

    // initialize storage
    await chrome.storage.local.clear();

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
  // get tab info
  const tab = await chrome.tabs.get(tabId);

  // update tab with original link if it was discarded
  if (tab.url.startsWith(DiscardTabURLPrefix)) {
    // get url from html in the url
    const url = getUrlFromHTML(tab.url.replace(DiscardTabURLPrefix, ''));

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
    id: generateId(),
    event: 'UPDATE_SPACE_ACTIVE_TAB',
    payload: {
      spaceId: updateSpace?.id,
      newActiveIndex: updateSpace?.activeTabIndex,
    },
  });
});

// event listener for when tabs get updated
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info?.status === 'complete') {
    // add/update tab
    await updateTabHandler(tabId);
  }
});

// event listener for when tabs get moved (index change)
chrome.tabs.onMoved.addListener(async (tabId, info) => {
  await wait(500);

  // get space by windowId
  const space = await getSpaceByWindow(info.windowId);

  if (!space?.id) return;

  // update tab index
  await updateTabIndex(space.id, tabId, info.toIndex);

  // update space's active tab index
  await updateActiveTabInSpace(info.windowId, info.toIndex);
  // send send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_TABS',
    payload: {
      spaceId: space.id,
    },
  });
  // send send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_SPACE_ACTIVE_TAB',
    payload: {
      spaceId: space.id,
      newActiveIndex: info.toIndex,
    },
  });
});

// on tab detached from window
chrome.tabs.onDetached.addListener(async (tabId, info) => {
  // handle tab remove from space
  await removeTabHandler(tabId, info.oldWindowId);
});

chrome.tabs.onAttached.addListener(async tabId => {
  // add tab to the attached space/window
  await updateTabHandler(tabId);
});

// event listener for when tabs get removed
chrome.tabs.onRemoved.addListener(async (tabId, info) => {
  // do nothing if tab removed because window was closed
  if (info.isWindowClosing) return;

  await removeTabHandler(tabId, info.windowId);
});

// window created/opened
chrome.windows.onCreated.addListener(window => {
  if (window.incognito) return;
  (async () => {
    // wait for .750s
    await wait(750);

    // get space by window
    const space = await getSpaceByWindow(window.id);

    // if this window is associated with a space then do nothing
    if (space?.id) return;

    // tabs of this window
    let tabs: ITab[] = [];

    // check if the window obj has tabs
    // if not, then query for tabs in this window
    if (window?.tabs?.length > 0) {
      tabs = window.tabs.map(t => ({ url: t.url, faviconURL: getFaviconURL(t.url), id: t.id, title: t.title }));
    } else {
      const queriedTabs = await chrome.tabs.query({ windowId: window.id });
      if (queriedTabs?.length < 1) return;
      tabs = queriedTabs.map(t => ({ url: t.url, faviconURL: getFaviconURL(t.url), id: t.id, title: t.title }));
    }

    // check if the tabs in this window are of a space (check tab urls)
    const res = await checkNewWindowTabs(window.id, [...tabs.map(tab => tab.url)]);

    // if the tabs in this window are part of a space, do nothing
    // window id was saved to the respective space
    if (res) return;

    // if not then create new unsaved space with all tabs
    // create new unsaved space
    const newUnsavedSpace = await createUnsavedSpace(window.id, tabs);

    // send send to side panel
    await publishEvents({
      id: generateId(),
      event: 'ADD_SPACE',
      payload: {
        space: { ...newUnsavedSpace, tabs: [...tabs] },
      },
    });
  })();
});

// window removed/closed
chrome.windows.onRemoved.addListener(async windowId => {
  // get space by window
  const space = await getSpaceByWindow(windowId);

  // if the space was not saved, then delete
  if (!space?.isSaved) {
    await deleteSpace(space.id);

    // send send to side panel
    await publishEvents({
      id: generateId(),
      event: 'REMOVE_SPACE',
      payload: {
        spaceId: space.id,
      },
    });
  }
});
