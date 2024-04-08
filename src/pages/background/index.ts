import 'webextension-polyfill';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');
// ***

import { logger } from '../../utils/logger';
import { debounceWithEvents, generateId, wait } from '../../utils';
import { retryAtIntervals } from '../../utils/retryAtIntervals';
import { asyncMessageHandler } from '../../utils/asyncMessageHandler';
import { handleSnoozedTabAlarm } from './handler/alarm/snoozed-tab';
import { getFaviconURL, isChromeUrl, parseUrl } from '../../utils/url';
import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { matchWordsInText } from '@root/src/utils/string/matchWordsInText';
import { publishEvents, publishEventsTab } from '../../utils/publish-events';
import { handleMergeSpaceHistoryAlarm } from './handler/alarm/mergeSpaceHistory';
import { createAlarm, getAlarm } from '@root/src/services/chrome-alarms/helpers';
import { cleanDomainName, getUrlDomain } from '@root/src/utils/url/get-url-domain';
import { getRecentlyVisitedSites } from '@root/src/services/chrome-history/history';
import { getCurrentTab, goToTab, openSpace } from '@root/src/services/chrome-tabs/tabs';
import { naturalLanguageToDate } from '@root/src/utils/date-time/naturalLanguageToDate';
import { getAppSettings, saveSettings } from '@root/src/services/chrome-storage/settings';
import { addSnoozedTab, getTabToUnSnooze } from '@root/src/services/chrome-storage/snooze-tabs';
import { handleMergeDailySpaceTimeChunksAlarm } from './handler/alarm/mergeDailySpaceTimeChunks';
import { getSpaceHistory, setSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { getDailySpaceTime, setDailySpaceTime } from '@root/src/services/chrome-storage/space-analytics';
import { addNewNote, getAllNotes, getNote, getNoteByDomain, updateNote } from '@root/src/services/chrome-storage/notes';
import {
  checkParentBMFolder,
  syncSpacesFromBookmarks,
  syncSpacesToBookmark,
} from '@root/src/services/chrome-bookmarks/bookmarks';
import {
  ICommand,
  IDailySpaceTimeChunks,
  IMessageEventContentScript,
  INote,
  ISiteVisit,
  ITab,
} from './../types/global.types';
import {
  getTabsInSpace,
  removeTabFromSpace,
  saveGlobalPinnedTabs,
  setTabsForSpace,
  updateTab,
  updateTabIndex,
} from '@root/src/services/chrome-storage/tabs';
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
  CommandType,
  ThemeColor,
  DISCARD_TAB_URL_PREFIX,
  DefaultAppSettings,
  DefaultPinnedTabs,
  SNOOZED_TAB_GROUP_TITLE,
  AlarmName,
  ALARM_NAME_PREFiX,
} from '@root/src/constants/app';

logger.info('🏁 background loaded');

//* IIFE - checks for alarms, its not guaranteed to persist
(async () => {
  const autoSaveToBMAlarm = await getAlarm(AlarmName.autoSaveBM);

  const autoDiscardTabsAlarm = await getAlarm(AlarmName.autoDiscardTabs);

  const midnightAlarm = await getAlarm(AlarmName.dailyMidnightTrigger);

  // create alarms if not found
  if (!autoSaveToBMAlarm?.name) {
    await createAlarm({ name: AlarmName.autoSaveBM, triggerAfter: 1440, isRecurring: true });
  }

  if (!autoDiscardTabsAlarm?.name) {
    await createAlarm({ name: AlarmName.autoDiscardTabs, triggerAfter: 5, isRecurring: true });
  }
  if (!midnightAlarm?.name) {
    await createAlarm({
      name: AlarmName.dailyMidnightTrigger,
      triggerAfter: 1440,
      isRecurring: true,
      shouldTriggerAtMidnight: true,
    });
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

// TODO - store favicon url in ITab

// TODO - track num of times user switch spaces

// TODO - Use UTC date & time stamp for server (save user timezone)

// TODO - reset day at 3am at default

// TODO - tab thumbnail views and also grid views

// TODO - change extension icon in toolbar based on space (other actions like notes saving, tab moved, etc.)

// TODO - DnD checks (tabs, spaces, merge, delete, create)

// TODO - attach a root container for command palette on site load complete,
//-- and then append the react component on command palette shortcut

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
        url: parseUrl(tab.url),
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

// record a site visit if closed
const recordSiteVisit = async (windowId: number, tabId: number) => {
  // get the tab's previous url details
  const space = await getSpaceByWindow(windowId);
  const tabsInSpace = await getTabsInSpace(space.id);

  const updatedTab = tabsInSpace.find(t => t.id === tabId);

  if (!updatedTab?.url || isChromeUrl(updatedTab.url)) return;
  const { url, title } = updatedTab;
  const spaceHistoryToday = await getSpaceHistory(space.id);
  const newSiteVisitRecord: ISiteVisit = { url, title, faviconUrl: getFaviconURL(url), timestamp: Date.now() };
  await setSpaceHistory(space.id, [newSiteVisitRecord, ...(spaceHistoryToday || [])]);

  logger.info('👍 Recorded site visit.');
};

// record a daily time spent in spaces in chunks
const recordDailySpaceTime = async (windowId: number) => {
  const dailySpaceTimeChunks: IDailySpaceTimeChunks = {
    spaceId: null,
    time: Date.now(),
  };

  if (windowId > 0) {
    // chrome window/space focused
    // get space
    const space = await getSpaceByWindow(windowId);
    dailySpaceTimeChunks.spaceId = space.id;
  }

  // focused outside chrome window (space=null)

  const dailySpaceTimeChunksToday = await getDailySpaceTime<IDailySpaceTimeChunks[]>(null);

  await setDailySpaceTime(null, [...(dailySpaceTimeChunksToday || []), dailySpaceTimeChunks]);
  logger.info('👍 Recorded daily space time chunk.');
};

// find notes for this site
const showNotesBubbleContentScript = async (url: string, tabId: number, windowId: number) => {
  if (!url) return;

  const domain = cleanDomainName(getUrlDomain(url));
  const notes = await getNoteByDomain(domain);

  if (notes?.length < 1) return;
  // if yes, send a event to context script with notes data

  const activeSpace = await getSpaceByWindow(windowId);
  // send msg/event to content scr
  await retryAtIntervals({
    interval: 1000,
    retries: 3,
    callback: async () => {
      return await publishEventsTab(tabId, {
        event: 'SHOW_DOMAIN_NOTES',
        payload: { activeSpace, noteIds: notes.map(n => n.id) },
      });
    },
  });
};

//  show command palette
export const showCommandPaletteContentScript = async (tabId: number, windowId: number) => {
  const recentSites = await getRecentlyVisitedSites();

  const activeSpace = await getSpaceByWindow(windowId);

  const preferences = await getAppSettings();

  // send msg/event to content scr
  await retryAtIntervals({
    interval: 1000,
    retries: 3,
    callback: async () => {
      return await publishEventsTab(tabId, {
        event: 'SHOW_COMMAND_PALETTE',
        payload: {
          activeSpace,
          recentSites,
          searchFilterPreferences: {
            searchBookmarks: preferences.includeBookmarksInSearch,
            searchNotes: preferences.includeNotesInSearch,
          },
        },
      });
    },
  });
};

// * chrome event listeners

// handle events from content script (command palette)
chrome.runtime.onMessage.addListener(
  asyncMessageHandler<IMessageEventContentScript, boolean | ICommand[]>(async request => {
    const { event, payload } = request;

    logger.info(`Event received at background:: ${event}`);

    switch (event) {
      case 'SWITCH_TAB': {
        const { tabId, shouldCloseCurrentTab } = payload;

        const currentTab = await getCurrentTab();

        await goToTab(tabId);

        if (shouldCloseCurrentTab) {
          await chrome.tabs.remove(currentTab.id);
        }

        return true;
      }
      case 'SWITCH_SPACE': {
        const { spaceId, shouldOpenInNewWindow } = payload;

        const space = await getSpace(spaceId);

        const tabs = await getTabsInSpace(spaceId);

        await openSpace({ space, tabs, shouldOpenInNewWindow });

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

      case 'NEW_NOTE': {
        const { activeSpace, note, url, noteRemainder } = payload;

        const currentTab = await getCurrentTab();

        const domain = cleanDomainName(url) || '';

        // TODO - create note title
        const title = currentTab.title || '';

        // new note data
        const newNote: INote = {
          title,
          domain,
          id: generateId(),
          text: note,
          spaceId: activeSpace.id,
          createdAt: new Date().getTime(),
          ...(noteRemainder && { remainderAt: naturalLanguageToDate(noteRemainder) }),
        };

        // create note
        await addNewNote(newNote);

        await publishEventsTab(currentTab.id, {
          event: 'SHOW_SNACKBAR',
          payload: { snackbarMsg: 'Note Captured' },
        });

        return true;
      }

      case 'EDIT_NOTE': {
        const { note, url, noteRemainder, noteId } = payload;

        const noteToEdit = await getNote(noteId);

        await updateNote(noteId, {
          ...noteToEdit,
          text: note,
          ...(url && { domain: url }),
          ...(noteRemainder && { remainderAt: naturalLanguageToDate(noteRemainder) }),
        });

        const currentTab = await getCurrentTab();

        await publishEventsTab(currentTab.id, {
          event: 'SHOW_SNACKBAR',
          payload: { snackbarMsg: 'Note Saved' },
        });

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
          await chrome.tabs.update(tab.id, { url: parseUrl(url) });
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
        const { searchQuery, searchFilterPreferences } = payload;

        const matchedCommands: ICommand[] = [];

        if (searchFilterPreferences.searchNotes) {
          let notes = await getAllNotes();

          notes = notes?.filter(note => {
            // match query with  domain
            if (note.domain.includes(searchQuery)) return true;
            // match query with title
            if (matchWordsInText(searchQuery, note.title)) return true;
            // match query with note text
            if (matchWordsInText(searchQuery, note.text)) return true;

            return false;
          });

          console.log('🚀 ~ index.ts:429 ~ SEARCH ~  notes:', notes);

          notes?.forEach((note, idx) => {
            if (!note?.text || !note?.title) return;

            matchedCommands.push({
              index: idx,
              type: CommandType.Note,
              label: note.title,
              // icon will be added in Command component
              icon: null,
              metadata: note.id,
              alias: 'Note',
            });
          });
        }

        if (searchFilterPreferences.searchBookmarks) {
          let bookmarks = await chrome.bookmarks.search({ query: searchQuery });

          // remove duplicate
          bookmarks = bookmarks.filter((bm, idx) => {
            const index = bookmarks.findIndex(b => b.url === bm.url);
            if (index === -1 || index === idx) return true;

            return false;
          });

          // do not show more than 10 bookmarks results
          bookmarks.length > 10 && bookmarks.splice(10);

          if (bookmarks?.length > 0) {
            bookmarks.forEach((item, idx) => {
              if (!item.url) return;
              matchedCommands.push({
                index: idx,
                type: CommandType.Link,
                label: item.title,
                icon: getFaviconURL(item.url, false),
                metadata: item.url,
                alias: 'Bookmark',
              });
            });
          }
        }

        // return the matched results if more than 6 (won't search history)
        if (matchedCommands.length > 6) return matchedCommands;

        // query history (words match)
        const history = await chrome.history.search({ text: searchQuery, maxResults: 4 });

        if (history?.length > 0) {
          history.forEach((item, idx) => {
            if (!item.url) return;
            matchedCommands.push({
              index: idx,
              type: CommandType.Link,
              label: item.title,
              icon: getFaviconURL(item.url, false),
              metadata: item.url,
              alias: 'History',
            });
          });
        }

        return matchedCommands;
      }
      case 'WEB_SEARCH': {
        const { searchQuery, shouldOpenInNewTab } = payload;

        // TODO - new tab search opens a tab in the end (open a new next tab and search)

        await chrome.search.query({ text: searchQuery, disposition: shouldOpenInNewTab ? 'NEW_TAB' : 'CURRENT_TAB' });
        return true;
      }
      case 'DISCARD_TABS': {
        return await discardTabs();
      }
      case 'SNOOZE_TAB': {
        const { snoozedUntil, spaceId } = payload;

        const [{ url, title, id, favIconUrl: faviconUrl }] = await chrome.tabs.query({
          active: true,
          currentWindow: true,
        });

        // add snooze tab to storage
        await addSnoozedTab(spaceId, {
          snoozedUntil,
          url,
          title,
          faviconUrl,
          snoozedAt: Date.now(),
        });

        const triggerTimeInMinutes = Math.ceil((snoozedUntil - Date.now()) / 1000 / 60);

        // create a alarm trigger
        await createAlarm({ name: AlarmName.snoozedTab(spaceId), triggerAfter: triggerTimeInMinutes });
        // close the tab
        await chrome.tabs.remove(id);
        return true;
      }

      case 'CLOSE_TAB': {
        const currentTab = await getCurrentTab();

        await chrome.tabs.remove(currentTab.id);

        return true;
      }
      default: {
        return true;
      }
    }
    // end switch statement
  }),
);

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
    await createAlarm({ name: AlarmName.autoSaveBM, triggerAfter: 1440, isRecurring: true });
    // auto discard  tabs (if non-active for more than 10 minutes)
    await createAlarm({ name: AlarmName.autoDiscardTabs, triggerAfter: 5, isRecurring: true });

    // merge space history everyday at midnight
    await createAlarm({
      name: AlarmName.dailyMidnightTrigger,
      triggerAfter: 1440,
      isRecurring: true,
      shouldTriggerAtMidnight: true,
    });

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

    if (currentTab?.url && isChromeUrl(currentTab?.url)) {
      // chrome url
      // switch tab as content script doesn't work on chrome pages

      //  TODO - use space history
      // get last visited url
      const recentlyVisitedURL = await getRecentlyVisitedSites(1);

      console.log('🚀 ~ chrome.commands.onCommand.addListener ~ recentlyVisitedURL:', recentlyVisitedURL);

      const tabs = await chrome.tabs.query({ currentWindow: true });

      if (tabs?.length < 2 || tabs.filter(t => isChromeUrl(t.url)).length === tabs.length) {
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

    // TODO - try using the content script to load command palette
    // const testScript = await chrome.scripting.executeScript({
    //   target: { tabId: currentTab.id },
    //   files: ['./src/pages/content/index.js'],
    // });

    // TODO - check if tab fully loaded
    const res = await publishEventsTab(activeTabId, { event: 'CHECK_CONTENT_SCRIPT_LOADED' });

    if (!res) {
      // wait for 0.2s
      await chrome.tabs.reload(activeTabId);
      await wait(250);
    }

    await showCommandPaletteContentScript(activeTabId, currentTab.windowId);
  }
});

// handle chrome alarm triggers
chrome.alarms.onAlarm.addListener(async alarm => {
  // handle delete unsaved space
  if (alarm.name.startsWith(ALARM_NAME_PREFiX.deleteSpace)) {
    const spaceId = alarm.name.split('-')[1];
    await deleteSpace(spaceId);
    await publishEvents({ id: generateId(), event: 'REMOVE_SPACE', payload: { spaceId } });
    return;
  } else if (alarm.name.startsWith(ALARM_NAME_PREFiX.snoozedTab)) {
    //  handle un-snooze tab
    await handleSnoozedTabAlarm(alarm.name);
  }

  // handle other alarm types
  switch (alarm.name) {
    case AlarmName.autoSaveBM: {
      await syncSpacesToBookmark();
      logger.info('⏰ 1day: Synced Spaces to Bookmark');
      break;
    }
    case AlarmName.autoDiscardTabs: {
      await discardTabs(true);
      logger.info('⏰ 10 mins: Auto discard tabs');
      break;
    }
    case AlarmName.dailyMidnightTrigger: {
      //  handle space analytics data

      await handleMergeSpaceHistoryAlarm();

      await handleMergeDailySpaceTimeChunksAlarm();

      logger.info('⏰ Midnight: merge space history & usage data');

      break;
    }
  }
});

// on notification button clicked
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (notificationId.includes('snoozed-tab-active-space')) {
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

  console.log('🚀 ~ chrome.tabs.onActivated.addListener ~ tab:', tab);

  if (tab.url.startsWith(DISCARD_TAB_URL_PREFIX)) {
    // update tab with original url
    await chrome.tabs.update(tabId, {
      url: parseUrl(tab.url),
    });
  }

  // record site usage

  // wait for 0.2s
  await wait(250);

  // update spaces' active tab
  const updateSpace = await updateActiveTabInSpace(windowId, tab.index);

  console.log('🚀 ~ chrome.tabs.onActivated.addListener ~ updateSpace:', updateSpace);

  // send send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_SPACE_ACTIVE_TAB',
    payload: {
      spaceId: updateSpace?.id,
      newActiveIndex: tab.index,
    },
  });
});

// event listener for when tabs get updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo?.url) {
    // record site visit for the previous url
    recordSiteVisit(tab.windowId, tab.id);
  }

  if (changeInfo?.status === 'complete') {
    // if this is discard tab, do nothing
    if (changeInfo?.url?.startsWith(DISCARD_TAB_URL_PREFIX)) return;

    // add/update tab
    await updateTabHandler(tabId);

    showNotesBubbleContentScript(tab?.url, tabId, tab.windowId);
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

  // record site visit for the previous url
  recordSiteVisit(info.windowId, tabId);

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
      tabs = window.tabs.map(t => ({ url: t.url, faviconUrl: getFaviconURL(t.url), id: t.id, title: t.title }));
    } else {
      const queriedTabs = await chrome.tabs.query({ windowId: window.id });
      if (queriedTabs?.length < 1) return;
      tabs = queriedTabs.map(t => ({ url: t.url, faviconUrl: getFaviconURL(t.url), id: t.id, title: t.title }));
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
      await createAlarm({ name: AlarmName.deleteSpace(space.id), triggerAfter: 10080 });

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

// on window focus
chrome.windows.onFocusChanged.addListener(async windowId => {
  // record daily space time
  await recordDailySpaceTime(windowId);
});

// handle tabs changed
const handleTabsReplaced = async events => {
  const eventsToProcess: { replacedTabId: number; tabId: number }[] = events.map(e => e[0]);

  const windows = await chrome.windows.getAll();

  for (const window of windows) {
    const space = await getSpaceByWindow(window.id);
    const tabsInSpace = await getTabsInSpace(space.id);
    // find changed tab
    const hasTabChanged = tabsInSpace.some(t => eventsToProcess.some(e => e.replacedTabId === t.id));

    if (!hasTabChanged) continue;

    const updatedTabs = [
      ...tabsInSpace.map(t => {
        const event = eventsToProcess.find(e => e.replacedTabId === t.id);

        if (!event?.tabId) return t;

        return { ...t, id: event.tabId };
      }),
    ];

    // update tabs storage
    await setTabsForSpace(space.id, updatedTabs);

    // send event to side panel for ui update
    await publishEvents({
      id: generateId(),
      event: 'UPDATE_TABS',
      payload: {
        spaceId: space.id,
      },
    });

    break;
  }
};

const debounceTabReplacedListener = debounceWithEvents(handleTabsReplaced, 500);

// on tabs content changed
chrome.webNavigation.onTabReplaced.addListener(({ replacedTabId, tabId }) => {
  debounceTabReplacedListener({ replacedTabId, tabId });
});
