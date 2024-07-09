import { parseUrl } from '@root/src/utils/url/parse-url';
import { IGroup, ISpace, ITab } from '@root/src/types/global.types';
import { getTabToUnSnooze } from '../chrome-storage/snooze-tabs';
import { getTabsInSpace, setTabsForSpace } from '../chrome-storage/tabs';
import { getSpace, getSpaceByWindow, updateSpace } from '../chrome-storage/spaces';
import { DISCARD_TAB_URL_PREFIX, SNOOZED_TAB_GROUP_TITLE } from '@root/src/constants/app';
import { addGroup, getAllGroups, setGroupsToSpace } from '../chrome-storage/groups';
import { generateId, logger, publishEvents, wait } from '@root/src/utils';

type OpenSpaceProps = {
  space: ISpace;
  tabs: ITab[];
  onNewWindowCreated?: (windowId: number) => void;
  shouldOpenInNewWindow: boolean;
};

// create new active tab
export const createActiveTab = async (url: string, index: number, windowId?: number) => {
  return await chrome.tabs.create({
    url,
    index,
    active: true,
    ...(windowId ? { windowId: windowId } : {}),
  });
};

// creates a html url tabs that doesn't load tab until user visits them
export const createDiscardedTabs = async (tabs: ITab[], windowId?: number, shouldCreateTabsAtEnd = false) => {
  //  set html for discard tabs so they load only after visited by user
  const discardedTabHTML = (tab: ITab) => `
      <!DOCTYPE html>
      <html>
      <head>
      <link rel="icon" href="${tab.faviconUrl}">
      <title>${tab.title}</title>
      <link href="//{[${tab.url}]}//">
      </head>
      <body>
      </body>
      </html>`;

  // batch all the promise to process at once (create's discarded tabs)
  const createMultipleTabsPromise = tabs.map((tab, index) => {
    if (isNaN(windowId)) {
      return chrome.tabs.create({
        url: `${DISCARD_TAB_URL_PREFIX}${encodeURIComponent(discardedTabHTML(tab))}`,
        active: false,
      });
    } else {
      return chrome.tabs.create({
        windowId,
        ...(!shouldCreateTabsAtEnd ? { index } : {}),
        active: false,
        url: `${DISCARD_TAB_URL_PREFIX}${encodeURIComponent(discardedTabHTML(tab))}`,
      });
    }
  });

  const responses = await Promise.allSettled(createMultipleTabsPromise);

  // if the just create flag is passed it will only create tabs and return
  if (!windowId) {
    return true;
  }

  const createdTabs: ITab[] = [];

  for (const res of responses) {
    // process only successful responses
    if (res.status === 'rejected') continue;

    const { url, pendingUrl, id } = res.value;

    const tabDiscardedURL = url || pendingUrl;

    const tabURL = parseUrl(tabDiscardedURL);

    // get the tab details (as the new tab doesn't have title)
    const matchedTab = tabs.find(tab => tab.url === tabURL);

    if (matchedTab) {
      // update tab with new id
      createdTabs.push({ ...matchedTab, id });
    }
  }

  return createdTabs;
};

// removes all tabs in the current window, also creates a temporary new tab
const clearCurrentWindow = async (windowId: number) => {
  // batch tabs to delete promises
  const tabsToBeDeletedPromises: Promise<void>[] = [];

  // get all non-active tabs in this window
  const currentWindowTabs = await chrome.tabs.query({ windowId, active: false });

  for (const tab of currentWindowTabs) {
    tabsToBeDeletedPromises.push(chrome.tabs.remove(tab.id));
  }

  // delete all the tabs in the current window
  await Promise.allSettled(tabsToBeDeletedPromises);
};

// check if the space is already opened in another window
const checkIfSpaceActiveInAnotherWindow = async (space: ISpace) => {
  // get all windows
  const windows = await chrome.windows.getAll();

  const activeSpaceWindow = windows.find(window => window.id === space.windowId);

  // space not active
  if (!activeSpaceWindow) return false;

  // space active in another window
  // focus the window
  await chrome.windows.update(activeSpaceWindow.id, { focused: true });
  return true;
};

// opens a space in new window
export const openSpace = async ({ space, tabs, onNewWindowCreated, shouldOpenInNewWindow }: OpenSpaceProps) => {
  // focus window is space already active
  const isAlreadyActive = await checkIfSpaceActiveInAnotherWindow(space);

  if (isAlreadyActive) {
    onNewWindowCreated && onNewWindowCreated(space.windowId);
    return;
  }

  // only active tab will be loaded, rest will be loaded after user visits them

  // space's active tab position
  const activeTabIndex = space.activeTabIndex;

  const activeTab: ITab = {
    url: tabs[activeTabIndex]?.url || 'chrome://newtab',
    title: tabs[activeTabIndex]?.title || 'New Tab',
    faviconUrl: tabs[activeTabIndex]?.faviconUrl || '',
    id: 0,
    index: activeTabIndex,
  };

  const discardedTabsToCreate = tabs.filter((_tab, idx) => idx !== activeTabIndex);

  let windowId = 0;

  let defaultWindowTabId = 0;

  // get the window based on user preference
  if (!shouldOpenInNewWindow) {
    // same window
    const currentWindowId = await getCurrentWindowId();

    const currentSpace = await getSpaceByWindow(currentWindowId);
    // storage tabs/groups of the current (previous) space to add them back after the window is cleared for new space
    const tabsInSpaceBefore = await getTabsInSpace(currentSpace.id);
    const groupsInSpace = await getAllGroups(currentSpace.id);

    // clear the current window
    await clearCurrentWindow(currentWindowId);
    // set window id
    windowId = currentWindowId;
    // set default tab id
    defaultWindowTabId = tabsInSpaceBefore[currentSpace.activeTabIndex].id;

    // remove this window id from the current space
    await updateSpace(currentSpace.id, { ...currentSpace, windowId: 0 });

    setTabsForSpace(currentSpace.id, tabsInSpaceBefore);
    setGroupsToSpace(currentSpace.id, groupsInSpace);
  } else {
    //  create new window
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
  onNewWindowCreated && onNewWindowCreated(windowId);

  const discardAllTabs = (await createDiscardedTabs(discardedTabsToCreate, windowId)) as ITab[];

  const activeTabCreated = await createActiveTab(activeTab.url, activeTab.index, windowId);

  activeTab.id = activeTabCreated.id;
  activeTab.url = activeTabCreated.pendingUrl || activeTabCreated.url;
  activeTab.index = activeTabCreated.index;

  // newly created tabs
  const updatedTabs = [...discardAllTabs, activeTab];

  // set tabs with new ids
  await setTabsForSpace(space.id, updatedTabs);

  // delete the default tab created (an empty tab gets created along with window)
  await chrome.tabs.remove(defaultWindowTabId);

  // group tabs if space has groups
  const groupsInSpace = await getAllGroups(space.id);

  if (groupsInSpace?.length > 0) {
    // map tabs to previous groups
    const groupsToCreate: Record<string, number[]> = {};

    tabs.forEach(tab => {
      if (tab?.groupId < 1) return;
      const newTabId = updatedTabs.find(t => t.index === tab.index)?.id;

      if (!groupsToCreate[tab.groupId]) groupsToCreate[tab.groupId] = [];

      groupsToCreate[tab.groupId].push(newTabId);
    });

    if (Object.keys(groupsToCreate).length > 1) {
      for (const groupId in groupsToCreate) {
        const groupInfo = groupsInSpace.find(g => g.id === Number(groupId));

        const newGroupId = await chrome.tabs.group({ tabIds: groupsToCreate[groupId], createProperties: { windowId } });

        await chrome.tabGroups.update(newGroupId, { title: groupInfo.name, collapsed: true, color: groupInfo.theme });
      }
    }
  }

  // making sure the tabs are updated & synced with window
  await syncTabs(space.id, windowId, activeTab.index);

  //  check if a snoozed tab has to be added
  // some tab might've been un-snoozed when the space was not active, so show it now
  const tabToUnSnooze = await getTabToUnSnooze(space.id);
  if (tabToUnSnooze?.title) {
    await newTabGroup(SNOOZED_TAB_GROUP_TITLE, tabToUnSnooze.url, windowId);
  }
};

// create a new tab
export const createTab = async (url: string, isActive = false) => {
  await chrome.tabs.create({ url, active: isActive });
};

// go to tab
export const goToTab = async (id: number) => {
  await chrome.tabs.update(id, { active: true });
};

// get current tab
export const getCurrentTab = async (windowId = 0): Promise<ITab> => {
  let currentTab = null;

  if (!windowId) {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
  } else {
    const [tab] = await chrome.tabs.query({ active: true, windowId });
    currentTab = tab;
  }

  if (!currentTab?.id) return null;

  return {
    id: currentTab.id,
    title: currentTab.title,
    faviconUrl: currentTab.favIconUrl,
    url: currentTab.url,
    index: currentTab.index,
    groupId: currentTab.groupId,
  };
};

// get current window id
export const getCurrentWindowId = async () => {
  const { id } = await chrome.windows.getCurrent();
  if (!id) return null;
  return id;
};

// new group with a tab
export const newTabGroup = async (groupTitle: string, tabURL: string, windowId: number) => {
  // create tab with un-snoozed tab url
  const newTab = await chrome.tabs.create({ windowId, url: tabURL, active: false });
  // create a group for snoozed tab
  const newSnoozedGroupId = await chrome.tabs.group({
    tabIds: newTab.id,
    createProperties: { windowId },
  });

  const space = await getSpaceByWindow(windowId);

  addGroup(space.id, { id: newSnoozedGroupId, name: SNOOZED_TAB_GROUP_TITLE, theme: 'orange', collapsed: false });

  // update group info
  await chrome.tabGroups.update(newSnoozedGroupId, {
    title: groupTitle,
    color: 'orange',
    collapsed: false,
  });
};

// open tabs in space when tabs moved to a space when it is opened in another window
export const openTabsInTransferredSpace = async (spaceId: string, tabs: ITab[], group?: IGroup) => {
  try {
    const openWindows = await chrome.windows.getAll();

    if (openWindows?.length < 2) return;
    // more than 1 window opened currently

    // check if selected space in another window
    const selectedSpace = await getSpace(spaceId);

    if (selectedSpace?.windowId < 0 || !openWindows.some(w => w.id === selectedSpace.windowId)) return;

    //  create new tabs in selected space

    // update Id's for newly created tabs
    const createdTabs = await createDiscardedTabs(tabs, selectedSpace.windowId, true);

    if (group?.name) {
      const newGroup = await chrome.tabs.group({
        tabIds: (createdTabs as ITab[]).map(t => t.id),
        createProperties: { windowId: selectedSpace.windowId },
      });

      await chrome.tabGroups.update(newGroup, {
        title: group.name,
        color: group.theme,
        collapsed: true,
      });
    }

    // wait .5s to sync tabs
    await wait(250);

    await syncTabs(selectedSpace.id, selectedSpace.windowId, selectedSpace.activeTabIndex);

    // file update tabs event for selected space to update state
    await publishEvents({ id: generateId(), event: 'UPDATE_TABS', payload: { spaceId } });

    if (group?.name) await publishEvents({ id: generateId(), event: 'UPDATE_GROUPS', payload: { spaceId } });
  } catch (error) {
    logger.error({
      error,
      msg: 'Error opening tabs in transferred space ~ catch block',
      fileTrace: 'services/chrome-tabs/tabs.ts:970',
    });
  }
};

// sync tabs/groups from browser to storage
export const syncTabs = async (
  spaceId: string,
  windowId: number,
  activeTabIndex: number,
  tabs = true,
  groups = true,
) => {
  let tabsInWindow: ITab[] = [];
  // tabs
  if (tabs) {
    // get all tabs in the window
    const currentTabs = await chrome.tabs.query({ windowId });
    tabsInWindow = currentTabs.map(t => ({
      title: t.title,
      url: parseUrl(t.url) || parseUrl(t.pendingUrl),
      id: t.id,
      faviconUrl: t.favIconUrl,
      index: t.index,
      groupId: t.groupId,
    }));
    await setTabsForSpace(spaceId, tabsInWindow);
  }
  let groupsInWindow: IGroup[] = [];

  // groups
  if (groups) {
    // get all groups
    const currentGroups = await chrome.tabGroups.query({ windowId });

    groupsInWindow = currentGroups.map(group => ({
      id: group.id,
      name: group.title,
      theme: group.color,
      collapsed: group.collapsed,
    }));

    await setGroupsToSpace(spaceId, groupsInWindow);
  }

  const activeTabQuery = await chrome.tabs.query({ windowId, active: true });

  let activeTab: chrome.tabs.Tab = null;
  if (activeTabQuery?.length > 0) {
    activeTab = activeTabQuery[0];

    // update  active tab index for space if changed
    if (activeTabIndex && activeTabIndex !== activeTab[0]?.index) {
      await updateSpace(spaceId, {
        activeTabIndex: activeTab.index,
      });
    }
  }

  return { activeTab, tabs: tabsInWindow, groups: groupsInWindow };
};
