import { recentlyVisitedSites } from '@root/src/services/chrome-history/history';
import { ITab } from './../types/global.types';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import {
  checkNewWindowTabs,
  createSampleSpaces,
  createUnsavedSpace,
  deleteSpace,
  getSpaceByWindow,
  updateActiveTabInSpace,
} from '@root/src/services/chrome-storage/spaces';
import {
  removeTabFromSpace,
  saveGlobalPinnedTabs,
  updateTab,
  updateTabIndex,
} from '@root/src/services/chrome-storage/tabs';
import { getFaviconURL, wait } from '../utils';
import { logger } from '../utils/logger';
import { publishEvents, publishEventsTab } from '../utils/publish-events';
import { generateId } from '../utils/generateId';
import {
  checkParentBMFolder,
  syncSpacesFromBookmarks,
  syncSpacesToBookmark,
} from '@root/src/services/chrome-bookmarks/bookmarks';
import { AlarmNames, DiscardTabURLPrefix, DefaultAppSettings, DefaultPinnedTabs } from '@root/src/constants/app';
import { getAppSettings, saveSettings } from '@root/src/services/chrome-storage/settings';
import { parseURL } from '../utils/parseURL';

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

//* common event handlers

const createUnsavedSpacesOnInstall = async () => {
  try {
    const windows = await chrome.windows.getAll();

    if (windows?.length < 1) throw new Error('No open windows found');

    for (const window of windows) {
      // check if widows associated with any saved spaces from bookmarks to not create a duplicate space
      if (await getSpaceByWindow(window.id)) continue;

      // get all tabs in the window
      const tabsInWindow = await chrome.tabs.query({ windowId: window.id });

      // check if the tabs in windows are associated with saved spaces to not create a duplicate space
      if (await checkNewWindowTabs(window.id, [...tabsInWindow.map(t => t.url)])) continue;

      if (tabsInWindow?.length < 1) throw new Error('No tabs found in window');

      const tabs: ITab[] = tabsInWindow.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: parseURL(tab.url),
      }));

      // active tab for window
      const activeIndex = tabsInWindow.find(tab => tab.active).index || 0;

      // create space
      await createUnsavedSpace(window.id, tabs, activeIndex);
    }

    // success
    return true;
  } catch (error) {
    logger.error({
      error: new Error('Failed to create unsaved spaces'),
      msg: 'Failed to initialize app',
      fileTrace: 'src/pages/background/index.ts:59 ~ createUnsavedSpacesOnInstall() ~ catch block',
    });
    return false;
  }
};

const updateTabHandler = async (tabId: number) => {
  // get tab details
  const tab = await chrome.tabs.get(tabId);

  if (tab?.url.startsWith(DiscardTabURLPrefix)) return;

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

  if (!space?.id) return;
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
    //* initialize the app

    // save default settings to sync storage
    await saveSettings(DefaultAppSettings);

    // save default pinned tabs
    await saveGlobalPinnedTabs(DefaultPinnedTabs);

    //-- check for saved spaces in bookmarks

    // 1. check if parent/root folder exists in bookmarks
    const rootBMFolderId = await checkParentBMFolder();

    if (!rootBMFolderId) {
      // new user
      // 2.a. create unsaved spaces for current opened windows
      await createUnsavedSpacesOnInstall();
      // 2.b. create sample spaces
      await createSampleSpaces();
    } else {
      // app's root folder found

      // 2.b. get spaces from the root folder
      const spacesWithTabs = await syncSpacesFromBookmarks(rootBMFolderId);

      if (spacesWithTabs?.length < 1) {
        // could not sync spaces from bookmarks

        // create sample space
        await createSampleSpaces();
      }
    }

    // create unsaved spaces for current opened windows
    await createUnsavedSpacesOnInstall();

    // set alarm schedules to save space to bookmark,
    // default preference is save daily (1d = 1440m)
    await chrome.alarms.create(AlarmNames.saveToBM, { periodInMinutes: 1440 });

    logger.info('✅ Successfully initialized app.');
  }
});

// shortcuts
chrome.commands.onCommand.addListener(async (command, tab) => {
  console.log('🚀 ~ chrome.commands.onCommand.addListener ~ command:', command);
  if (command === 'cmdPalette') {
    // TODO - redirect to different tab if user on chrome:// url
    // TODO - handle new tab

    if (tab?.url.startsWith('chrome://')) return;

    const recentSites = await recentlyVisitedSites();

    await publishEventsTab(tab.id, { event: 'SHOW_COMMAND_PALETTE', payload: { recentSites } });
  }
});

// handle chrome alarms triggers
chrome.alarms.onAlarm.addListener(async alarm => {
  // handle delete unsaved space
  if (alarm.name.startsWith('deleteSpace')) {
    const spaceId = alarm.name.split('-')[1];
    await deleteSpace(spaceId);
    await publishEvents({ id: generateId(), event: 'REMOVE_SPACE', payload: { spaceId } });
    return;
  }

  // handle save spaces to bookmark
  if (alarm.name === AlarmNames.saveToBM) {
    await syncSpacesToBookmark();
    logger.info('✅ Synced Spaces to Bookmark');
  }
});

// IIFE - checks for alarms, its not guaranteed to persist
(async () => {
  //TODO - testing
  const sites = await chrome.topSites.get();

  console.log('🚀 ~ sites:', sites);

  const alarm = await chrome.alarms.get(AlarmNames.saveToBM);
  if (alarm?.name) return;

  // create alarm if not found
  await chrome.alarms.create(AlarmNames.saveToBM, { periodInMinutes: 1440 });
})();

// When the new tab is selected, get the link in the title and load the page
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  // get tab info
  const tab = await chrome.tabs.get(tabId);

  if (tab.url.startsWith(DiscardTabURLPrefix)) {
    // update tab with original url
    await chrome.tabs.update(tabId, {
      url: parseURL(tab.url),
    });
  }

  // wait for 1s
  await wait(500);

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
    // if this is discard tab, do nothing
    if (info?.url?.startsWith(DiscardTabURLPrefix)) return;

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

  // check if active tab has changed
  const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (space.activeTabIndex !== activeTab.index) {
    // tabs moved from side panel

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
  }

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

// on tab attached to a window
chrome.tabs.onAttached.addListener(async tabId => {
  // add tab to the attached space/window
  await updateTabHandler(tabId);
});

// event listener for when tabs are closed
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
    // get user preference
    const { deleteUnsavedSpace } = await getAppSettings();

    // if user preference is to delete unsaved after a week
    // set an alarm for after a week (1w = 10080m)
    if (deleteUnsavedSpace === 'week') {
      await chrome.alarms.create(AlarmNames.deleteSpace(space.id), { delayInMinutes: 10080 });
      return;
    }
    // delete space immediately
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
