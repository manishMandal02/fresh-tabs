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

import { retryAtIntervals } from '../../utils/retry-at-intervals';
import { debounceWithEvents, generateId, wait } from '../../utils';
import { handleSnoozedTabAlarm } from './handler/alarm/un-snooze-tab';
import { asyncMessageHandler } from '../../utils/async-message-handler';
import { matchWordsInText } from '@root/src/utils/string/matchWordsInText';
import { discardAllTabs } from '@root/src/services/chrome-discard/discard';
import { getFaviconURLAsync, isChromeUrl, parseUrl } from '../../utils/url';
import { handleNotesRemainderAlarm } from './handler/alarm/notes-remainder';
import { publishEvents, publishEventsTab } from '../../utils/publish-events';
import { handleMergeSpaceHistoryAlarm } from './handler/alarm/mergeSpaceHistory';
import { createAlarm, getAlarm } from '@root/src/services/chrome-alarms/helpers';
import { removeWWWPrefix, getUrlDomain } from '@root/src/utils/url/get-url-domain';
import { getStorage, setStorage } from '@root/src/services/chrome-storage/helpers';
import { removeGroup, updateGroup } from '@root/src/services/chrome-storage/groups';
import { naturalLanguageToDate } from '@root/src/utils/date-time/naturalLanguageToDate';
import { getAppSettings, saveSettings } from '@root/src/services/chrome-storage/settings';
import { addSnoozedTab, getTabToUnSnooze } from '@root/src/services/chrome-storage/snooze-tabs';
import { handleMergeDailySpaceTimeChunksAlarm } from './handler/alarm/mergeDailySpaceTimeChunks';
import { getSpaceHistory, setSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { getDailySpaceTime, setDailySpaceTime } from '@root/src/services/chrome-storage/space-analytics';
import {
  checkParentBMFolder,
  syncSpacesFromBookmarks,
  syncSpacesToBookmark,
} from '@root/src/services/chrome-bookmarks/bookmarks';
import {
  addNewNote,
  deleteNote,
  getAllNotes,
  getNote,
  getNoteByDomain,
  updateNote,
} from '@root/src/services/chrome-storage/notes';
import {
  createActiveTab,
  getCurrentTab,
  getCurrentWindowId,
  goToTab,
  openSpace,
  openTabsInTransferredSpace,
  syncTabs,
} from '@root/src/services/chrome-tabs/tabs';
import {
  ICommand,
  IDailySpaceTimeChunks,
  IMessageEventContentScript,
  INote,
  ISiteVisit,
  ISpace,
  ITab,
} from '../../types/global.types';
import { getTabsInSpace, removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
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
  SNOOZED_TAB_GROUP_TITLE,
  AlarmName,
  ALARM_NAME_PREFiX,
  ContextMenuItem,
  ContextMenuSnoozeOptions,
} from '@root/src/constants/app';
import { removeOlderSpaceHistory } from './handler/alarm/removeOlderSpaceHistory';

logger.info('🏁 background loaded');

// update extension badge
const checkExtensionBadgeEmoji = async () => {
  const currentWindow = await getCurrentWindowId();
  const activeSpace = await getSpaceByWindow(currentWindow);
  const currentBadge = await chrome.action.getBadgeText({});

  if (currentBadge?.trim() !== activeSpace?.emoji) {
    await chrome.action.setBadgeBackgroundColor({ color: '#1e293b' });
    await chrome.action.setBadgeText({ text: activeSpace?.emoji || '' });
  }
};

//* IIFE - checks for alarms, its not guaranteed to persist
(async () => {
  await checkExtensionBadgeEmoji();

  // initializeContextMenuItems();

  //TODO - testing... save default settings to sync storage
  // await saveSettings(DefaultAppSettings);

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

// TODO fix - error on content script:: extension context invalidated error

// TODO - improve - add cmd palette preference option to remove cmd

// TODO - complete auth UI and logic for FE

//!------

// TODO - improvement - paginating larger data sets like notes for better performance and
//+ query data when searched or for domain notes

// TODO - feat - new tab (full app)
//+ tab thumbnail views and also grid views

// TODO - feat - add screenshots/image to notes (allow pasting images, capture screen and quick create note)

// TODO - backend - Use UTC date & time stamp for server & reset day @ 3am (save user timezone)

//* helpers for chrome event handlers
const createUnsavedSpacesOnInstall = async () => {
  try {
    const windows = await chrome.windows.getAll();

    if (windows?.length < 1) throw new Error('No open windows found');

    for (const window of windows) {
      // check if widows associated with any saved spaces from bookmarks to not create a duplicate space
      if (await getSpaceByWindow(window.id)) continue;

      // get all tabs in the window
      const tabsInWindow = await chrome.tabs.query({ windowId: window.id });

      if (tabsInWindow?.length < 1) throw new Error('No tabs found in window');

      // check if the tabs in windows are associated with saved spaces to not create a duplicate space
      if (await checkNewWindowTabs(window.id, [...tabsInWindow.map(t => t.url)])) continue;

      const tabs: ITab[] = tabsInWindow.map(tab => ({
        id: tab.id,
        title: tab.title,
        faviconUrl: tab.favIconUrl,
        url: parseUrl(tab.url),
        index: tab.index,
        groupId: tab.groupId,
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
      error: new Error('Failed to initialize app.'),
      msg: 'Failed to create unsaved spaces during app initialization.',
      fileTrace: 'src/pages/background/index.ts:195 ~ createUnsavedSpacesOnInstall() ~ catch block',
    });
    return false;
  }
};

const initializeContextMenuItems = () => {
  for (const item in ContextMenuItem) {
    chrome.contextMenus.create(
      {
        id: ContextMenuItem[item],
        title: ContextMenuItem[item],
        contexts: ['all'],
      },
      () => {
        if (chrome.runtime.lastError) {
          logger.error({
            error: new Error(chrome.runtime.lastError?.message),
            msg: 'Error at chrome.contextMenus.create()',
            fileTrace: 'src/pages/background/index.ts:213 ~ initializeContextMenuItems()',
          });
          return;
        }

        if (ContextMenuItem[item] !== ContextMenuItem.SNOOZE_TAB) return;

        // add sub-menu items for snooze tab

        ContextMenuSnoozeOptions.forEach(option => {
          chrome.contextMenus.create(
            {
              parentId: ContextMenuItem[item],
              id: `${item}-${option}`,
              title: option,
              contexts: ['all'],
            },
            () => {},
          );
        });
      },
    );
  }
};

const syncTabsAndGroups = async (tabId: number, windowId?: number, syncGroups = false) => {
  console.log('🔴 ~ syncTabsAndGroups called!!');

  let spaceWindow = windowId;

  if (tabId) {
    // get tab details
    const tab = await chrome.tabs.get(tabId);

    if (tab?.url.startsWith(DISCARD_TAB_URL_PREFIX)) return;
    spaceWindow = tab.windowId;
  }

  // get space by windowId
  const space = await getSpaceByWindow(spaceWindow);

  if (!space?.id) return;

  //  create new  or update tab
  const { activeTab } = await syncTabs(space.id, space.windowId, space.activeTabIndex, true, syncGroups);

  // send  to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_TABS',
    payload: {
      spaceId: space.id,
    },
  });

  if (activeTab?.index !== space.activeTabIndex) {
    // send  to side panel
    await publishEvents({
      id: generateId(),
      event: 'UPDATE_SPACE_ACTIVE_TAB',
      payload: {
        spaceId: space.id,
        newActiveIndex: activeTab?.index || 0,
      },
    });
  }
};

const removeTabHandler = async (tabId: number, windowId: number) => {
  // get space by windowId
  const space = await getSpaceByWindow(windowId);

  if (!space?.id) return;
  // remove tab
  await removeTabFromSpace(space, tabId);

  // send to side panel
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

  if (!space?.id) return;

  const tabsInSpace = await getTabsInSpace(space.id);

  const updatedTab = tabsInSpace.find(t => t.id === tabId);

  if (!updatedTab?.url.startsWith('http')) return;

  const { url, title } = updatedTab;
  const spaceHistoryToday = await getSpaceHistory(space.id);
  const newSiteVisitRecord: ISiteVisit = { url, title, timestamp: Date.now() };
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
    if (!space?.id) return;
    dailySpaceTimeChunks.spaceId = space.id;
  }

  // focused outside chrome window (space=null)

  const dailySpaceTimeChunksToday = await getDailySpaceTime<IDailySpaceTimeChunks[]>(null);

  await setDailySpaceTime(null, [...(dailySpaceTimeChunksToday || []), dailySpaceTimeChunks]);
  logger.info('👍 Recorded daily space time chunk.');
};

// find notes for this site
const showNotesBubbleContentScript = async (url: string, tabId: number, windowId: number) => {
  if (!url || isChromeUrl(url)) return;

  const { notes } = await getAppSettings();

  if (!notes.showOnAllSites) {
    // show notes bubble only for sites with notes
    const domain = removeWWWPrefix(getUrlDomain(url));
    const notes = await getNoteByDomain(domain);

    // do nothing if no notes found for this domain
    if (notes?.length < 1) return;
  }

  // send a event to context script with notes data
  const activeSpace = await getSpaceByWindow(windowId);
  // send msg/event to content scr
  await retryAtIntervals({
    interval: 1000,
    retries: 3,
    callback: async () => {
      return await publishEventsTab(tabId, {
        event: 'SHOW_DOMAIN_NOTES',
        payload: { activeSpace, notesBubblePos: notes.bubblePos },
      });
    },
  });
};

//  show command palette
export const showCommandPaletteContentScript = async (
  tabId: number,
  windowId: number,
  shouldOpenInPopupWindow = false,
) => {
  let canOpenInContentScript = false;

  // the re-adding of content script incase the content script is not responding
  if (!shouldOpenInPopupWindow) {
    // checks if content script is loaded
    const res = await publishEventsTab(tabId, { event: 'CHECK_CONTENT_SCRIPT_LOADED' });

    if (res) {
      // will open in content script
      canOpenInContentScript = true;
    } else {
      // content script not responding, add the content script to this tab and
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ['src/pages/content/index.js'],
      });

      await wait(250);
      // check if content script is responding
      const res2 = await publishEventsTab(tabId, { event: 'CHECK_CONTENT_SCRIPT_LOADED' });
      if (res2) canOpenInContentScript = true;
    }
  }

  if (!canOpenInContentScript) {
    // check if popup window is already open

    const popupWindow = await getStorage<string>({ type: 'local', key: 'TEMP_POPUP_WINDOW' });

    if (popupWindow) {
      // if popup already created then focus the window
      const popupId = popupWindow.split('-')[1];

      await chrome.windows.update(Number(popupId), { focused: true });
      return;
    }

    // open command palette in new popup window
    const currentWindow = await chrome.windows.get(windowId);

    const popupOffsetTop = Math.ceil(currentWindow.height + currentWindow.top) / 4;
    const popupOffsetLeft = Math.ceil(currentWindow.width / 4 + currentWindow.left);

    const window = await chrome.windows.create({
      focused: true,
      type: 'popup',
      state: 'normal',
      url: chrome.runtime.getURL(`src/pages/command-palette-popup/index.html?windowId=${currentWindow.id}`),
      width: 700,
      height: 465,
      top: popupOffsetTop,
      left: popupOffsetLeft,
    });

    await setStorage({ type: 'session', key: 'TEMP_POPUP_WINDOW', value: `${currentWindow.id}-${window.id}` });

    await wait(350);
    // bug:temp-fix: sometimes 2 popup window with cmd palette are opened when trigged (via shortcut) from side panel
    // close the other popup windows

    const allWindows = await chrome.windows.getAll();

    allWindows.forEach(async popup => {
      if (popup.type !== 'popup') return;

      const tempPopupWindow = await getStorage<string>({ type: 'session', key: 'TEMP_POPUP_WINDOW' });

      if (popup.id === Number(tempPopupWindow?.split('-')[1] || 0)) {
        await chrome.windows.update(window.id, { focused: true });
        return;
      }
      // making sure that it is a command palette widow before removing
      await chrome.windows.remove(popup.id);
    });

    return;
  }

  // get command palette props data

  const activeSpace = await getSpaceByWindow(windowId);

  const preferences = await getAppSettings();

  const currentTab = await chrome.tabs.get(tabId);

  const tabGroupId = currentTab?.groupId || 0;

  // send msg/event to content script to open command palette
  await retryAtIntervals({
    interval: 500,
    retries: 2,
    callback: async () => {
      return await publishEventsTab(tabId, {
        event: 'SHOW_COMMAND_PALETTE',
        payload: {
          activeSpace,
          groupId: tabGroupId,
          searchFilterPreferences: {
            searchBookmarks: preferences.cmdPalette.includeBookmarksInSearch,
            searchNotes: preferences.cmdPalette.includeNotesInSearch,
          },
        },
      });
    },
  });
};

// chrome.runtime.connect().onDisconnect.addListener(() => {
//   console.log('🚫 ~ chrome.runtime.connect().onDisconnect ~ Disconnected!! ');
// });

// * chrome event listeners

// handle events from content script (command palette)
chrome.runtime.onMessage.addListener(
  asyncMessageHandler<IMessageEventContentScript, boolean | ICommand[]>(async request => {
    const { event, payload } = request;

    logger.info(`Event received at runtime.onMessage:: ${event}`);

    // handle events cases
    switch (event) {
      case 'SWITCH_TAB': {
        const { tabId, shouldCloseCurrentTab, isOpenedInPopupWindow, activeSpace } = payload;

        const currentTab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

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
        const { spaceTitle, isOpenedInPopupWindow, activeSpace } = payload;

        const tab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        const newSpace = await createNewSpace(
          {
            title: spaceTitle,
            emoji: '🚀',
            theme: ThemeColor.Cyan,
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
        const { activeSpace, note, url, noteRemainder, noteTitle, isOpenedInPopupWindow } = payload;

        const currentTab = await getCurrentTab();

        const domain = removeWWWPrefix(url) || '';

        const title = noteTitle || currentTab.title;

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

        const { notes } = await getAppSettings();

        if (!isOpenedInPopupWindow) {
          await publishEventsTab(currentTab.id, {
            event: 'SHOW_SNACKBAR',
            payload: { activeSpace, notesBubblePos: notes.bubblePos, snackbarMsg: 'Note Captured' },
          });
        }

        // send to side panel
        await publishEvents({
          id: generateId(),
          event: 'UPDATE_NOTIFICATIONS',
          payload: {
            spaceId: activeSpace.id,
          },
        });

        return true;
      }

      case 'EDIT_NOTE': {
        const { note, url, activeSpace, noteRemainder, noteId, noteTitle, isOpenedInPopupWindow } = payload;

        const noteToEdit = await getNote(noteId);

        await updateNote(noteId, {
          ...noteToEdit,
          text: note,
          ...(noteTitle && { title: noteTitle }),
          ...(url && { domain: url }),
          ...(noteRemainder && { remainderAt: naturalLanguageToDate(noteRemainder) }),
        });

        const currentTab = await getCurrentTab();

        const { notes } = await getAppSettings();

        if (!isOpenedInPopupWindow) {
          await publishEventsTab(currentTab.id, {
            event: 'SHOW_SNACKBAR',
            payload: { activeSpace, notesBubblePos: notes.bubblePos, snackbarMsg: 'Note Saved' },
          });
        }

        // send to side panel
        await publishEvents({
          id: generateId(),
          event: 'UPDATE_NOTIFICATIONS',
          payload: {
            spaceId: activeSpace.id,
          },
        });

        return true;
      }

      case 'DELETE_NOTE': {
        const { noteId, spaceId } = payload;
        await deleteNote(noteId);

        // send to side panel
        await publishEvents({
          id: generateId(),
          event: 'UPDATE_NOTIFICATIONS',
          payload: {
            spaceId,
          },
        });
        return true;
      }

      case 'NEW_GROUP': {
        const { groupName, isOpenedInPopupWindow, activeSpace } = payload;

        const tab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        const newGroupId = await chrome.tabs.group({
          tabIds: tab.id,
          ...(isOpenedInPopupWindow ? { createProperties: { windowId: activeSpace.windowId } } : {}),
        });

        await chrome.tabGroups.update(newGroupId, {
          title: groupName,
          color: 'blue',
          collapsed: false,
        });

        return true;
      }

      case 'ADD_TO_GROUP': {
        const { groupId, isOpenedInPopupWindow, activeSpace } = payload;
        const tab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        await chrome.tabs.group({ groupId, tabIds: tab.id });

        return true;
      }

      case 'RENAME_GROUP': {
        const { groupId, groupName } = payload;

        await chrome.tabGroups.update(groupId, { title: groupName });

        return true;
      }

      case 'GO_TO_URL': {
        const { url, shouldOpenInNewTab, isOpenedInPopupWindow, activeSpace } = payload;

        // check if url already opened indifferent tab
        let openedTab = null;

        if (isOpenedInPopupWindow) {
          const [matchedTab] = await chrome.tabs.query({ url, windowId: activeSpace.windowId });
          openedTab = matchedTab;
        } else {
          const [matchedTab] = await chrome.tabs.query({ url, currentWindow: true });
          openedTab = matchedTab;
        }

        if (openedTab?.id) {
          await goToTab(openedTab.id);
          return true;
        }

        const { index, ...tab } = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        if (!shouldOpenInNewTab) {
          await chrome.tabs.update(tab.id, { url: parseUrl(url) });
        } else {
          await chrome.tabs.create({ index: index + 1, url, active: true });
        }

        return true;
      }

      case 'OPEN_PREVIEW_LINK_AS_TAB': {
        const { url } = payload;

        const popupWindow = await getStorage<string>({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW' });
        if (!popupWindow) return;

        const spaceId = popupWindow.split('-')[0];
        const popupWindowId = Number(popupWindow.split('-')[1]);

        const space = await getSpace(spaceId);

        await chrome.tabs.create({ url, active: true, windowId: space.windowId });

        await chrome.windows.update(space.windowId, { focused: true });

        await chrome.windows.remove(popupWindowId);

        return true;
      }

      case 'OPEN_APP_SIDEPANEL': {
        const { windowId } = payload;

        await chrome.sidePanel.open({ windowId });

        if (payload?.isOpenedInPopupWindow) {
          await chrome.windows.update(windowId, { focused: true });
        }

        if (payload?.openSidePanelModal) {
          setTimeout(async () => {
            // retry until side panel loaded
            await retryAtIntervals({
              retries: 3,
              interval: 250,
              callback: async () => {
                // open modal based on command selected
                return await publishEvents({
                  id: generateId(),
                  event: 'OPEN_MODAL',
                  payload: { openSidePanelModal: payload.openSidePanelModal },
                });
              },
            });
          }, 250);
        }

        return true;
      }

      case 'MOVE_TAB_TO_SPACE': {
        const { spaceId, isOpenedInPopupWindow, activeSpace } = payload;
        const tabsInSpace = await getTabsInSpace(spaceId);

        const tab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        await setTabsForSpace(spaceId, [...tabsInSpace, tab]);

        await chrome.tabs.remove(tab.id);

        // create new tab if selected space is opened in another window
        await openTabsInTransferredSpace(spaceId, [tab]);
        return true;
      }

      case 'SEARCH': {
        const { searchQuery, searchFilterPreferences, searchResLimit } = payload;

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

          if (notes?.length > 0) {
            // do not show more than search result limit
            notes.length > searchResLimit && notes.splice(searchResLimit);

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
        }

        // return the matched results if more than result limit (won't search bookmark & history)
        if (matchedCommands.length >= searchResLimit) return matchedCommands;

        if (searchFilterPreferences.searchBookmarks) {
          let bookmarks = await chrome.bookmarks.search({ query: searchQuery });

          // remove duplicate
          bookmarks = bookmarks.filter((bm, idx) => {
            const index = bookmarks.findIndex(b => b.url === bm.url);
            if (index === -1 || index === idx) return true;

            return false;
          });

          // limit search results
          if (bookmarks.length + matchedCommands.length > searchResLimit) {
            bookmarks = bookmarks.splice(0, searchResLimit - matchedCommands.length);
          }

          if (bookmarks?.length > 0) {
            for (const item of bookmarks) {
              if (!item) return;
              const icon = await getFaviconURLAsync(item.url);

              matchedCommands.push({
                icon,
                index: 0,
                type: CommandType.Link,
                label: item.title,
                metadata: item.url,
                alias: 'Bookmark',
              });
            }
          }
        }

        // return the matched results if more than 6 (won't search history)
        if (matchedCommands.length >= searchResLimit) return matchedCommands;

        // get 1 month before date to find history before that
        const oneMonthBefore = new Date();

        oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 2);

        // query history (words match)
        let history = await chrome.history.search({
          text: searchQuery,
          startTime: oneMonthBefore.getTime(),
          maxResults: searchResLimit - matchedCommands.length,
        });

        if (history?.length > 0) {
          // remove duplicate
          history = history.filter((h1, idx) => {
            const index = history.findIndex(b => b.url === h1.url);
            if (index === -1 || index === idx) return true;

            return false;
          });

          for (const item of history) {
            if (!item.url) return;
            const icon = await getFaviconURLAsync(item.url);

            matchedCommands.push({
              icon,
              index: 0,
              type: CommandType.Link,
              label: item.title,
              metadata: parseUrl(item.url),
              alias: 'History',
            });
          }
        }

        return matchedCommands;
      }

      case 'WEB_SEARCH': {
        const { searchQuery, shouldOpenInNewTab, isOpenedInPopupWindow, activeSpace } = payload;

        if (!shouldOpenInNewTab) {
          // search in current tab
          await chrome.search.query({ text: searchQuery, disposition: 'CURRENT_TAB' });
        } else {
          // create new tab to search (as the default new tab search opens a new tab at the end to search)
          const currentTab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

          const newTab = await createActiveTab('chrome://newtab', currentTab.index + 1);

          await chrome.search.query({ text: searchQuery, tabId: newTab.id });
        }

        return true;
      }

      case 'DISCARD_TABS': {
        const { shouldIgnoreDiscardWhitelist } = payload;
        return await discardAllTabs(false, shouldIgnoreDiscardWhitelist);
      }

      case 'WHITE_LIST_DOMAIN_FOR_AUTO_DISCARD': {
        const { activeSpace, isOpenedInPopupWindow } = payload;

        const currentTab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        const domainToWhitelist = getUrlDomain(currentTab.url);

        const appSettings = await getAppSettings();

        await saveSettings({
          ...appSettings,
          autoDiscardTabs: {
            ...appSettings.autoDiscardTabs,
            whitelistedDomains: [...(appSettings.autoDiscardTabs.whitelistedDomains || []), domainToWhitelist],
          },
        });

        return;
      }

      case 'SNOOZE_TAB': {
        const { snoozedUntil, spaceId, isOpenedInPopupWindow, activeSpace } = payload;

        let activeTab: chrome.tabs.Tab = null;

        if (isOpenedInPopupWindow) {
          const [matchedTab] = await chrome.tabs.query({
            active: true,
            windowId: activeSpace.windowId,
          });

          activeTab = matchedTab;
        } else {
          const [matchedTab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
          });

          activeTab = matchedTab;
        }

        const { url, title, id, favIconUrl: faviconUrl } = activeTab;

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
        const { activeSpace, isOpenedInPopupWindow } = payload;
        const currentTab = await getCurrentTab(isOpenedInPopupWindow ? activeSpace.windowId : 0);

        await chrome.tabs.remove(currentTab.id);

        return true;
      }

      case 'OPEN_LINK_PREVIEW_POPUP': {
        const popupWindowId = await getStorage<number>({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW' });

        if (popupWindowId) {
          try {
            const popupWindow = await chrome.windows.get(popupWindowId);
            if (popupWindow?.id) return true;
          } catch {
            await setStorage({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW', value: '' });
          }
        }
        const { url } = payload;

        const currentWindow = await chrome.windows.getCurrent();

        const { linkPreview } = await getAppSettings();

        // calculate window size based on user preference
        let windowWidth = 0;
        let windowHeight = 0;
        let popupOffsetLeft = 0;

        if (linkPreview.size === 'mobile') {
          windowWidth = 480;
          windowHeight = 750;
          popupOffsetLeft = Math.ceil(currentWindow.width / 4 + currentWindow.left);
        }
        if (linkPreview.size === 'tablet') {
          windowWidth = 1100;
          windowHeight = 750;
          popupOffsetLeft = Math.ceil(currentWindow.left + currentWindow.width / 5);
        }
        if (linkPreview.size === 'desktop') {
          windowWidth = 1350;
          windowHeight = 850;
          popupOffsetLeft = Math.ceil(currentWindow.left + 80);
        }

        const window = await chrome.windows.create({
          url,
          type: 'popup',
          state: 'normal',
          focused: true,
          width: windowWidth,
          height: windowHeight,
          left: popupOffsetLeft,
          top: currentWindow.top + 140,
        });

        await wait(100);

        const space = await getSpaceByWindow(currentWindow.id);

        if (!space?.id || window?.tabs?.length < 1) return false;

        //  save popup window id to storage TEMP_..
        await setStorage({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW', value: `${space.id}-${window.id}` });

        return true;
      }

      default: {
        return true;
      }
    }
  }),
);

// on extension installed
chrome.runtime.onInstalled.addListener(async info => {
  if (info.reason !== 'install') return;
  //* initialize the app
  // save default settings to sync storage
  await saveSettings(DefaultAppSettings);

  // save default pinned tabs
  // await saveGlobalPinnedTabs(DefaultPinnedTabs);

  // set context menu items
  initializeContextMenuItems();

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
});

// on extension installed
chrome.runtime.onSuspend.addListener(async () => {});

// shortcut commands
chrome.commands.onCommand.addListener(async (command, tab) => {
  try {
    // link preview popup window
    let popupWindow = await getStorage<string>({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW' });

    if (!popupWindow) {
      popupWindow = await getStorage<string>({ type: 'session', key: 'TEMP_POPUP_WINDOW' });

      // do nothing is command palette is already opened
      if (popupWindow && command === 'cmdPalette') return;
    }

    if (popupWindow) {
      const spaceId = popupWindow.split('-')[0];

      const windowId = Number(popupWindow.split('-')[1]);
      const space = await getSpace(spaceId);

      await chrome.windows.remove(windowId);
      await setStorage({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW', value: '' });

      await chrome.windows.update(space.windowId, { focused: true });

      await wait(200);
    }

    let currentTab = tab;

    if (popupWindow || !tab?.id) {
      const [activeTab] = await chrome.tabs.query({ currentWindow: true, active: true });

      if (!activeTab) {
        const window = await chrome.windows.getLastFocused({ populate: true });

        currentTab = window.tabs.find(t => t.active);

        if (!currentTab) {
          const [otherActiveTab] = await chrome.tabs.query({ active: true });

          currentTab = otherActiveTab;
        }
      } else {
        currentTab = activeTab;
      }
    }

    //* new tab to right shortcut
    if (command === 'newTab') {
      const newTab = await createActiveTab('chrome://newtab', currentTab.index + 1);

      const [nextTab] = await chrome.tabs.query({ index: newTab.index + 1 });

      // remove the a new tab if created duplicate new tab
      if (nextTab?.pendingUrl?.startsWith('chrome://newtab')) {
        await chrome.tabs.remove(nextTab.id);
      }

      return;
    }

    // handle open command palette
    if (command === 'cmdPalette') {
      const { cmdPalette } = await getAppSettings();

      // do nothing if cmd palette feat disabled
      if (cmdPalette.isDisabled) return;

      const shouldOpenInPopupWindow = !currentTab?.url || isChromeUrl(currentTab.url);

      await showCommandPaletteContentScript(currentTab.id, currentTab.windowId, shouldOpenInPopupWindow);
    }
  } catch (error) {
    logger.error({
      error,
      msg: 'Error in on command listener',
      fileTrace: 'background.ts:753 ~ chrome.commands.onCommand.addListener() ~ catch block',
    });
  }
});

// handle alarm triggers
chrome.alarms.onAlarm.addListener(async alarm => {
  try {
    // handle alarm names with prefix tag ex: deleteSpace-, snoozedTab-, etc.
    if (alarm.name.startsWith(ALARM_NAME_PREFiX.deleteSpace)) {
      //  delete unsaved space
      const spaceId = alarm.name.split('-')[1];
      await deleteSpace(spaceId);
      await publishEvents({ id: generateId(), event: 'REMOVE_SPACE', payload: { spaceId } });
      logger.info(`⏰ Deleted Unsaved space: ${spaceId}`);
      return;
    } else if (alarm.name.startsWith(ALARM_NAME_PREFiX.snoozedTab)) {
      // handle un-snooze tab
      await handleSnoozedTabAlarm(alarm.name);
      return;
    } else if (alarm.name.startsWith(ALARM_NAME_PREFiX.noteRemainder)) {
      //  handle note remainder trigger
      await handleNotesRemainderAlarm(alarm.name);
      return;
    }

    // handle recurring alarms
    switch (alarm.name) {
      case AlarmName.autoSaveBM: {
        await syncSpacesToBookmark();
        logger.info('⏰🔃 1day: Synced Spaces to Bookmark');
        break;
      }
      case AlarmName.autoDiscardTabs: {
        await discardAllTabs(true);
        logger.info('⏰🔃 5 mins: Auto discarded tabs based on idle time set by user');
        break;
      }
      case AlarmName.dailyMidnightTrigger: {
        //  handle space analytics data

        await handleMergeSpaceHistoryAlarm();

        await handleMergeDailySpaceTimeChunksAlarm();

        // delete space history older than 30 days
        await removeOlderSpaceHistory();

        // remove history from browser of temp popup window created for command palette
        await chrome.history.deleteUrl({
          url: `chrome-extension://${chrome.runtime.id}/src/pages/command-palette-popup/index.html`,
        });

        logger.info('⏰🔃 Midnight: merge space history & usage data');

        break;
      }
      default: {
        logger.info(`⏰ ${alarm.name} alarm triggered, no handler attached ⚠️`);
      }
    }
  } catch (error) {
    logger.error({
      error,
      msg: 'Error in onAlarm.addListener',
      fileTrace: 'background.ts:926 ~ chrome.alarms.onAlarm.addListener() ~ catch block',
    });
  }
});

// on context menu item clicked
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.parentMenuItemId === ContextMenuItem.SNOOZE_TAB) {
    // snooze tab option clicked
    const optionSelected = info.menuItemId.toString()?.split('-')[1] || '';

    // get time for the selected option
    const time = naturalLanguageToDate(optionSelected);

    const space = await getSpaceByWindow(tab.windowId);

    // add snooze tab to storage
    await addSnoozedTab(space.id, {
      snoozedUntil: time,
      url: parseUrl(tab.url),
      title: tab.title,
      faviconUrl: tab.favIconUrl,
      snoozedAt: Date.now(),
    });

    const triggerTimeInMinutes = Math.ceil((time - Date.now()) / 1000 / 60);

    // create a alarm trigger
    await createAlarm({ name: AlarmName.snoozedTab(space.id), triggerAfter: triggerTimeInMinutes });
    // close the tab
    await chrome.tabs.remove(tab.id);
    return;
  }

  if (info.menuItemId === ContextMenuItem.OPEN_APP) {
    // open side panel
    await chrome.sidePanel.open({ tabId: tab.id });
    return;
  }

  if (info.menuItemId === ContextMenuItem.DISCARD_TABS) {
    // open options page
    await discardAllTabs();
    return;
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

  const space = await getSpaceByWindow(windowId);

  if (!space?.id) return;

  if (tab.url.startsWith(DISCARD_TAB_URL_PREFIX)) {
    // update tab with original url
    await chrome.tabs.update(tabId, {
      url: parseUrl(tab.url),
    });
  }

  // wait for 0.2s
  await wait(250);

  // update spaces' active tab
  const updateSpace = await updateActiveTabInSpace(windowId, tab.index);

  // send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_SPACE_ACTIVE_TAB',
    payload: {
      spaceId: updateSpace?.id,
      newActiveIndex: tab.index,
    },
  });
});

//* TODO - improvement - debounce handler
// event listener for when tabs get updated
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  console.log('🔵 ~ chrome.tabs.onUpdated.addListener ~ changeInfo:', changeInfo);

  // checking if the updated tab is in popup window created for link preview
  // if yes, show the button overlay
  const linkPreviewPopupWindow = await getStorage<string>({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW' });

  if (linkPreviewPopupWindow && tab?.windowId === Number(linkPreviewPopupWindow.split('-')[1])) {
    if (changeInfo.status === 'complete') {
      const spaceId = linkPreviewPopupWindow.split('-')[0];

      const space = await getSpace(spaceId);

      await wait(300);

      await publishEventsTab(tabId, {
        event: 'POPUP_PREVIEW_BUTTON_OVERLAY',
        payload: { windowId: space.windowId },
      });
    }
    return;
  }

  const space = await getSpaceByWindow(tab.windowId);

  if (!space?.id) return;

  try {
    if (changeInfo?.url) {
      // record site visit for the previous url
      recordSiteVisit(tab.windowId, tab.id);
    }

    if (changeInfo?.status === 'complete') {
      // if this is discard tab, do nothing
      if (changeInfo?.url?.startsWith(DISCARD_TAB_URL_PREFIX)) return;

      // add/update tab
      await syncTabsAndGroups(tabId);

      showNotesBubbleContentScript(tab?.url, tabId, tab.windowId);
    }

    if (changeInfo?.discarded) {
      const space = await getSpaceByWindow(tab.windowId);
      // send to side panel
      await publishEvents({
        id: generateId(),
        event: 'TABS_DISCARDED',
        payload: { spaceId: space.id },
      });
    }

    // handle tab's group change
    if (changeInfo?.groupId) {
      // make sure the window is open before syncing updates
      // wait for 0.5s to process updated changes (incase a window closed)
      await wait(500);

      const window = await chrome.windows.get(tab.windowId);

      // do nothing if window was closed
      if (!window?.id) return;

      // add/update tab
      await syncTabsAndGroups(tabId, 0, true);
    }
  } catch (error) {
    logger.error({
      error,
      msg: 'Error in chrome.tabs.onUpdated.addListener ~ catch block',
      fileTrace: 'background/index.ts:970',
    });
  }
});

//* TODO - improvement - debounce handler
// event listener for when tabs get moved (index change)
chrome.tabs.onMoved.addListener(async (tabId, info) => {
  await wait(250);

  // get space by windowId
  const space = await getSpaceByWindow(info.windowId);

  if (!space?.id) return;

  // update tab index
  await syncTabsAndGroups(tabId);
});

// on tab detached from window
chrome.tabs.onDetached.addListener(async (tabId, info) => {
  // handle tab remove from space
  await removeTabHandler(tabId, info.oldWindowId);
});

// on tab attached to a window
chrome.tabs.onAttached.addListener(async tabId => {
  // add tab to the attached space/window
  await syncTabsAndGroups(tabId);
});

// on tab closed
chrome.tabs.onRemoved.addListener(async (tabId, info) => {
  // do nothing if tab removed because window was closed
  if (info.isWindowClosing) return;

  // record site visit for the previous url
  recordSiteVisit(info.windowId, tabId);

  await removeTabHandler(tabId, info.windowId);
});

// on group create
chrome.tabGroups.onCreated.addListener(async group => {
  let space: ISpace = await getSpaceByWindow(group.windowId);

  if (!space?.id) {
    // add retry as new created windows may take some time to be associated with a space
    await retryAtIntervals({
      retries: 4,
      interval: 1000,
      callback: async () => {
        const windowSpace = await getSpaceByWindow(group.windowId);
        if (!windowSpace) return false;

        space = windowSpace;
        return true;
      },
    });
  }

  await syncTabsAndGroups(null, group.windowId, true);

  // send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_GROUPS',
    payload: {
      spaceId: space.id,
    },
  });
});

// on  group removed/deleted
chrome.tabGroups.onRemoved.addListener(async group => {
  try {
    // wait 0.5s to process updated event data (incase a window was closed)
    await wait(500);

    // do nothing if window was closed
    const window = await chrome.windows.get(group.windowId);
    if (!window?.id) return;

    const space = await getSpaceByWindow(group.windowId);

    await removeGroup(space.id, group.id);

    await syncTabsAndGroups(null, group.windowId, true);

    // send to side panel
    await publishEvents({
      id: generateId(),
      event: 'UPDATE_GROUPS',
      payload: {
        spaceId: space.id,
      },
    });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error in chrome.tabGroups.onRemoved.addListener ~ catch block',
      fileTrace: 'background/index.ts:1081',
    });
  }
});

// on  group removed/deleted
chrome.tabGroups.onUpdated.addListener(async group => {
  let space: ISpace = await getSpaceByWindow(group.windowId);

  if (!space?.id) {
    // add retry as new created windows may take some time to be associated with a space
    await retryAtIntervals({
      retries: 4,
      interval: 1000,
      callback: async () => {
        const windowSpace = await getSpaceByWindow(group.windowId);
        if (!windowSpace) return false;

        space = windowSpace;

        return true;
      },
    });
  }

  await updateGroup(space.id, { id: group.id, name: group.title, theme: group.color, collapsed: group.collapsed });

  // send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_GROUPS',
    payload: {
      spaceId: space.id,
    },
  });
});

//* TODO - improvement - debounce handler
// on group moved
chrome.tabGroups.onMoved.addListener(async group => {
  await syncTabsAndGroups(null, group.windowId, true);
});

// window created/opened
chrome.windows.onCreated.addListener(window => {
  // do nothing if incognito window
  if (window.incognito || window.type !== 'normal') return;

  (async () => {
    // wait for 1s
    await wait(1000);

    // get space by window
    const space = await getSpaceByWindow(window.id);

    // if this window is associated with a space then do nothing
    if (space?.id) return;

    // tabs of this window
    let tabs: ITab[] = [];

    // check if the chrome window obj has tabs
    if (window?.tabs?.length > 0) {
      tabs = window.tabs.map(t => ({
        url: t.url,
        id: t.id,
        title: t.title,
        index: t.index,
        faviconUrl: t.favIconUrl,
      }));
    } else {
      // if tabs not found, then query for tabs in this window
      const queriedTabs = await chrome.tabs.query({ windowId: window.id });

      if (queriedTabs?.length < 1) return;
      tabs = queriedTabs.map(t => ({
        url: t.url,
        id: t.id,
        title: t.title,
        index: t.index,
        faviconUrl: t.favIconUrl,
      }));
    }

    // check if the tabs in this window are of a space (check tab urls)
    const res = await checkNewWindowTabs(window.id, [...tabs.map(tab => tab.url)]);

    // if the tabs in this window are part of a space, do nothing
    // window id was saved to the respective space
    if (res) return;

    // if not then create new unsaved space with all tabs
    // create new unsaved space
    const newUnsavedSpace = await createUnsavedSpace(window.id, tabs);

    // send to side panel
    await publishEvents({
      id: generateId(),
      event: 'ADD_SPACE',
      payload: {
        space: { ...newUnsavedSpace },
      },
    });
  })();
});

// window removed/closed
chrome.windows.onRemoved.addListener(async windowId => {
  const linkPreviewWindow = await getStorage<string>({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW' });
  const windowId1 = Number(linkPreviewWindow?.split('-')[1] || 0);
  if (linkPreviewWindow && windowId1 === windowId) {
    // a temp popup window was removed, clear window id from storage
    await setStorage({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW', value: '' });
    return;
  }

  const tempPopupWindow = await getStorage<string>({ type: 'session', key: 'TEMP_POPUP_WINDOW' });

  const windowId2 = Number(tempPopupWindow?.split('-')[1] || 0);

  if (tempPopupWindow && windowId2 === windowId) {
    // a temp popup window was removed, clear window id from storage
    await setStorage({ type: 'session', key: 'TEMP_POPUP_WINDOW', value: '' });
    return;
  }

  // get space by window
  const space = await getSpaceByWindow(windowId);

  // if the space is a saved space then do nothing
  if (!space?.id || space?.isSaved) return;

  // get user preference
  const { deleteUnsavedSpace } = await getAppSettings();

  // if user preference is to delete unsaved space after a week
  // set an alarm for after a week (1w = 10080m)
  if (deleteUnsavedSpace === 'week') {
    await createAlarm({ name: AlarmName.deleteSpace(space.id), triggerAfter: 10080 });

    return;
  }

  // delete space immediately
  const res = await deleteSpace(space.id);

  console.log('✅ ~ windows.onRemoved ~ space deleted ~ res:', res);

  // send to side panel
  await publishEvents({
    id: generateId(),
    event: 'REMOVE_SPACE',
    payload: {
      spaceId: space.id,
    },
  });
});

// on window focus
chrome.windows.onFocusChanged.addListener(async windowId => {
  // record daily space time
  await recordDailySpaceTime(windowId);

  // remove temp pop windows if any
  try {
    if (windowId > 0) {
      const currentWindow = await chrome.windows.get(windowId);

      if (currentWindow.type === 'popup') return;
    }

    // remove popup window of command palette
    const tempPopupWindow = await getStorage<string>({ type: 'session', key: 'TEMP_POPUP_WINDOW' });
    const tempPopupWindowId = tempPopupWindow ? Number(tempPopupWindow.split('-')[1] || 0) : 0;

    if (tempPopupWindow && tempPopupWindowId > 0) {
      // remove popup window
      await chrome.windows.remove(tempPopupWindowId);
      await setStorage({ type: 'session', key: 'TEMP_POPUP_WINDOW', value: '' });
    }

    // remove link preview popup window
    const linkPreviewPopupWindow = await getStorage<string>({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW' });
    const previewWindowId = linkPreviewPopupWindow ? Number(linkPreviewPopupWindow.split('-')[1] || 0) : 0;
    if (linkPreviewPopupWindow && previewWindowId > 0) {
      // remove popup window
      await chrome.windows.remove(previewWindowId);
      await setStorage({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW', value: '' });
    }
  } catch (error) {
    // clear both window id incase of an error
    await setStorage({ type: 'session', key: 'TEMP_POPUP_WINDOW', value: '' });
    await setStorage({ type: 'session', key: 'LINK_PREVIEW_POPUP_WINDOW', value: '' });

    logger.error({
      error,
      msg: 'Error while removing temp popup window',
      fileTrace: 'background/index.ts ~ chrome.windows.onFocusChanged():1667',
    });
  }
});

// handle tabs changed
const handleTabsReplaced = async events => {
  const eventsToProcess: { replacedTabId: number; tabId: number }[] = events.map(e => e[0]);

  const windows = await chrome.windows.getAll();

  for (const window of windows) {
    const space = await getSpaceByWindow(window.id);

    if (space?.id) continue;

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
  }
};

const debounceTabReplacedListener = debounceWithEvents(handleTabsReplaced, 500);

// on tabs content changed
chrome.webNavigation.onTabReplaced.addListener(({ replacedTabId, tabId }) => {
  debounceTabReplacedListener({ replacedTabId, tabId });
});
