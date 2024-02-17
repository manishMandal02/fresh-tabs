import { getMostVisitedSites, getRecentlyVisitedSites } from '@root/src/services/chrome-history/history';
import { ICommand, IMessageEventContentScript, ISpace, ITab } from './../types/global.types';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import {
  checkNewWindowTabs,
  createNewSpace,
  createSampleSpaces,
  createUnsavedSpace,
  deleteSpace,
  getSpace,
  getSpaceByWindow,
  updateActiveTabInSpace,
} from '@root/src/services/chrome-storage/spaces';
import {
  getTabsInSpace,
  removeTabFromSpace,
  saveGlobalPinnedTabs,
  setTabsForSpace,
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
import {
  CommandType,
  ThemeColor,
  DISCARD_TAB_URL_PREFIX,
  DefaultAppSettings,
  DefaultPinnedTabs,
  SNOOZED_TAB_GROUP_TITLE,
} from '@root/src/constants/app';
import { getAppSettings, saveSettings } from '@root/src/services/chrome-storage/settings';
import { parseURL } from '../utils/parseURL';
import { getCurrentTab, goToTab, newTabGroup, openSpace } from '@root/src/services/chrome-tabs/tabs';
import { retryAtIntervals } from '../utils/retryAtIntervals';
import { asyncMessageHandler } from '../utils/asyncMessageHandler';
import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { createAlarm, getAlarm } from '@root/src/services/chrome-alarms/alarm';
import { addSnoozedTab, getTabToUnSnooze, removeSnoozedTab } from '@root/src/services/chrome-storage/snooze-tabs';
import { showUnSnoozedNotification } from '@root/src/services/chrome-notification/notification';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

logger.info('🏁 background loaded');

// IIFE - checks for alarms, its not guaranteed to persist
(async () => {
  const autoSaveToBMAlarm = await getAlarm('auto-save-to-bm');

  const autoDiscardTabsAlarm = await getAlarm('auto-discard-tabs');

  // TODO - testing

  // create alarms if not found
  if (!autoSaveToBMAlarm?.name) {
    await createAlarm('auto-save-to-bm', 1440, true);
  }

  if (!autoDiscardTabsAlarm?.name) {
    await createAlarm('auto-discard-tabs', 5, true);
  }
})();

// open side panel on extension icon clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => {
  logger.error({
    error,
    msg: `Error at ~ chrome.sidePanel.setPanelBehavior()`,
    fileTrace: 'src/pages/background/index.ts:35 ~ chrome.sidePanel.setPanelBehavior()',
  });
});

// TODO - don't switch space in same window if meeting is in place

// TODO - remove the concept of unsaved spaces, make the necessary changes
// all spaces will be saved by default

// handle events from content script (command palette)
chrome.runtime.onMessage.addListener(
  asyncMessageHandler<IMessageEventContentScript, boolean | ICommand[]>(async request => {
    const { event, payload } = request;

    console.log('🚀 ~ onMessage: event:', event);

    switch (event) {
      case 'SWITCH_TAB': {
        const { tabId } = payload;

        console.log('🚀 ~ tabId:', tabId);

        await goToTab(tabId);

        return true;
      }
      case 'SWITCH_SPACE': {
        const { spaceId } = payload;

        const space = await getSpace(spaceId);

        const tabs = await getTabsInSpace(spaceId);

        await openSpace({ space, tabs, shouldOpenInNewWindow: false });

        return true;
      }
      case 'NEW_SPACE': {
        const { spaceTitle } = payload;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { index, ...tab } = await getCurrentTab();

        // TODO - new space with title
        const newSpace = await createNewSpace(
          {
            title: spaceTitle,
            emoji: '🚀',
            theme: ThemeColor.Teal,
            activeTabIndex: 0,
            isSaved: true,
            windowId: 0,
          },
          [tab],
        );

        await openSpace({ space: newSpace, tabs: [tab], shouldOpenInNewWindow: false });

        return true;
      }

      case 'GO_TO_URL': {
        const { url, shouldOpenInNewTab } = payload;

        // check if url already opened indifferent tab
        const [openedTab] = await chrome.tabs.query({ url, currentWindow: true });

        if (openedTab?.id) {
          await goToTab(openedTab.id);
          return true;
        }

        const { index, ...tab } = await getCurrentTab();
        if (!shouldOpenInNewTab) {
          await chrome.tabs.update(tab.id, { url: parseURL(url) });
        } else {
          await chrome.tabs.create({ index: index + 1, url, active: true });
        }

        return true;
      }
      case 'MOVE_TAB_TO_SPACE': {
        const { spaceId } = payload;
        const tabsInSpace = await getTabsInSpace(spaceId);

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { index, ...tab } = await getCurrentTab();

        await setTabsForSpace(spaceId, [...tabsInSpace, tab]);

        await chrome.tabs.remove(tab.id);

        return true;
      }
      case 'SEARCH': {
        const { searchQuery } = payload;

        const matchedCommands: ICommand[] = [];

        // TODO - query bookmark (words match)

        // query history (words match)
        const history = await chrome.history.search({ text: searchQuery, maxResults: 4 });

        if (history?.length > 0) {
          history.forEach((item, idx) => {
            matchedCommands.push({
              index: idx,
              type: CommandType.RecentSite,
              label: item.title,
              icon: getFaviconURL(item.url, false),
              metadata: item.url,
            });
          });
        }

        console.log('🚀 ~ chrome.runtime.onMessage.addListener ~ matchedCommands:', matchedCommands);
        return matchedCommands;
      }
      case 'WEB_SEARCH': {
        const { searchQuery, shouldOpenInNewTab } = payload;

        console.log('🚀 ~ searchQuery:', searchQuery);

        // TODO - new tab search opens a tab in the end (open a new next tab and search)

        await chrome.search.query({ text: searchQuery, disposition: shouldOpenInNewTab ? 'NEW_TAB' : 'CURRENT_TAB' });
        return true;
      }
      case 'DISCARD_TABS': {
        return await discardTabs();
      }
      case 'SNOOZE_TAB': {
        const { snoozedUntil, spaceId } = payload;

        console.log('🚀 ~ snoozedUntil:', snoozedUntil);

        // TODO - try to create dynamic commands for snooze-tab sub command
        // try:: so that when user types time or day it'll create command matching that
        // if not:: possible then then create few pre built time commands

        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

        console.log('🚀 ~ SNOOZE_TAB ~ handler : tab:', tab);

        // add snooze tab to storage
        await addSnoozedTab(spaceId, {
          url: tab.url,
          title: tab.title,
          faviconURL: tab.favIconUrl,
          snoozeUntil: 1,
        });
        // create a alarm trigger
        await createAlarm(`snoozedTab-${spaceId}`, 1);
        // close the tab
        await chrome.tabs.remove(tab.id);
        return true;
      }
    }
    // end switch statement
  }),
);

// helpers for chrome event handlers

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

  if (tab?.url.startsWith(DISCARD_TAB_URL_PREFIX)) return;

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

// * chrome event listeners

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
    await createAlarm('auto-save-to-bm', 1440, true);
    // auto discard  tabs (if non-active for more than 10 minutes)
    await createAlarm('auto-discard-tabs', 5, true);

    logger.info('✅ Successfully initialized app.');
  }
});

// shortcut commands
chrome.commands.onCommand.addListener(async (command, tab) => {
  // TODO - handle new tab
  if (command === 'cmdPalette') {
    let currentTab = tab;

    if (!currentTab?.id) {
      const [activeTab] = await chrome.tabs.query({ currentWindow: true, active: true });
      currentTab = activeTab;
    }

    let activeTabId = currentTab?.id;

    if (currentTab?.url.startsWith('chrome://')) {
      // switch tab as content script doesn't work on chrome pages

      // get last visited url
      const recentlyVisitedURL = await getRecentlyVisitedSites(1);

      const tabs = await chrome.tabs.query({ currentWindow: true });

      if (tabs.length < 2 || tabs.filter(t => t.url.startsWith('chrome://')).length === tabs.length) {
        // create new tab if one 1 tab exists
        const newTab = await chrome.tabs.create({ url: recentlyVisitedURL[0].url, active: true });
        activeTabId = newTab.id;
      } else {
        // find the tab based on the url
        const [lastActiveTab] = await chrome.tabs.query({ title: recentlyVisitedURL[0].title, currentWindow: true });

        if (lastActiveTab?.id) {
          activeTabId = lastActiveTab.id;
        } else {
          // get next tab if last active tab not found
          const [nextTab] = await chrome.tabs.query({ index: currentTab.index + 1, currentWindow: true });

          if (nextTab) {
            activeTabId = nextTab.id;
          } else {
            // get first tab
            const [previousTab] = await chrome.tabs.query({ index: currentTab.index - 1, currentWindow: true });
            if (previousTab) {
              activeTabId = previousTab.id;
            }
          }
        }
        await goToTab(activeTabId);
      }
    }

    const recentSites = await getRecentlyVisitedSites();

    const topSites = await getMostVisitedSites();

    const activeSpace = await getSpaceByWindow(currentTab.windowId);

    //  check if content script is loaded
    // TODO - check if tab fully loaded
    const res = await publishEventsTab(activeTabId, { event: 'CHECK_CONTENT_SCRIPT_LOADED' });

    console.log('🚀 ~ chrome.commands.onCommand.addListener ~ res:', res);
    console.log('🚀 ~ chrome.commands.onCommand.addListener ~ activeTabId:', activeTabId);
    if (!res) {
      // wait for 0.2s
      await chrome.tabs.reload(activeTabId);
      await wait(250);
    }

    retryAtIntervals({
      interval: 1000,
      retries: 3,
      callback: async () => {
        console.log('🚀 ~ retryAtIntervals ~ SHOW_COMMAND_PALETTE:');
        return await publishEventsTab(activeTabId, {
          event: 'SHOW_COMMAND_PALETTE',
          payload: { activeSpace, recentSites, topSites },
        });
      },
    });
  }
});

// handle chrome alars triggers
chrome.alarms.onAlarm.addListener(async alarm => {
  // handle delete unsaved space
  if (alarm.name.startsWith('deleteSpace-')) {
    const spaceId = alarm.name.split('-')[1];
    await deleteSpace(spaceId);
    await publishEvents({ id: generateId(), event: 'REMOVE_SPACE', payload: { spaceId } });
    return;
  } else if (alarm.name.startsWith('snoozedTab-')) {
    //  un-snooze tab
    // extract space id from name (tab was snoozed from this space)
    const spaceId = alarm.name.split('-')[1];

    // get the snoozed tab info
    const { url, title, faviconURL } = await getTabToUnSnooze(spaceId);

    console.log('🚀 ~ onAlarm getTabToUnSnooze:473 ~ title:', title);

    // check if snoozed tab's space is active
    // also check for multi space/window scenario
    let currentSpace: ISpace = null;

    const windows = await chrome.windows.getAll();

    for (const window of windows) {
      const space = await getSpaceByWindow(window.id);
      if (space?.id === spaceId) {
        currentSpace = space;
      }
    }

    if (currentSpace?.id) {
      // if yes open snoozed tab in group

      // create a group for snoozed tab
      await newTabGroup(SNOOZED_TAB_GROUP_TITLE, url, currentSpace.windowId);

      // remove the tab from the snoozed storage
      await removeSnoozedTab(spaceId, url);

      // show notification with show tab button
      showUnSnoozedNotification(spaceId, `⏰ Tab Snoozed 1 min ago`, title, faviconURL, true);
      return;
    } else {
      // if not, show notification (open tab, open space)
      showUnSnoozedNotification(spaceId, `⏰ Tab Snoozed 1 min ago`, title, faviconURL, false);
    }
  }

  // handle other alarm types
  switch (alarm.name) {
    case alarm.name: {
      break;
    }
    case 'auto-save-to-bm': {
      await syncSpacesToBookmark();
      logger.info('⏰ 1day: Synced Spaces to Bookmark');
      break;
    }
    case 'auto-discard-tabs': {
      await discardTabs(true);
      logger.info('⏰ 5 mins: Auto discard tabs');
      break;
    }
  }
});

// on notification button clicked
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  console.log('🚀 ~ chrome.notifications.onButtonClicked.addListener ~ notificationId:', notificationId);

  if (notificationId.includes('snoozed-tab-active-space')) {
    console.log('🚀 ~ chrome.notifications.onButtonClicked.addListener ~ buttonIndex:', buttonIndex);
    if (buttonIndex === 0) {
      // open tab

      // get the id of the snoozed group
      const [group] = await chrome.tabGroups.query({ title: SNOOZED_TAB_GROUP_TITLE });

      if (!group?.id) return;
      // find the tab
      const [tab] = await chrome.tabs.query({ groupId: group.id });
      // go to the active
      await goToTab(tab.id);
      // close/remove the group
      await chrome.tabs.ungroup(tab.id);
    }
    //
  } else if (notificationId.startsWith('snoozed-tab-for-')) {
    const spaceId = notificationId.split('-')[3];
    if (buttonIndex === 0) {
      // open tab

      const tab = await getTabToUnSnooze(spaceId);
      await chrome.tabs.create({ url: tab.url, active: true });
    } else if (buttonIndex === 1) {
      // open space
      const space = await getSpace(spaceId);
      const tabs = await getTabsInSpace(spaceId);
      await openSpace({ space, tabs, shouldOpenInNewWindow: true });
    }
  }
});

// When the new tab is selected, get the link in the title and load the page
chrome.tabs.onActivated.addListener(async ({ tabId, windowId }) => {
  // get tab info
  const tab = await chrome.tabs.get(tabId);

  if (tab.url.startsWith(DISCARD_TAB_URL_PREFIX)) {
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
    if (info?.url?.startsWith(DISCARD_TAB_URL_PREFIX)) return;

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
      await createAlarm(`deleteSpace-${space.id}`, 10080);
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
