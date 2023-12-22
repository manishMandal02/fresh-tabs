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
import { getFaviconURL } from '../utils';
import { logger } from '../utils/logger';
import { setStorage } from '@root/src/services/chrome-storage/helpers/set';

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

  // update spaces' active tab
  await updateActiveTabInSpace(windowId, tab.index);
});

// event listener for when tabs get updated
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info?.status === 'complete') {
    // get tab info

    const tab = await chrome.tabs.get(tabId);

    // get space by windowId
    const space = await getSpaceByWindow(tab.windowId);

    console.log('🚀 ~ file: index.ts:130 ~ chrome.tabs.onUpdated.addListener ~ space:', space);

    if (!space.id) return;

    //  create new  or update tab
    await updateTab(space?.id, { url: tab.url, title: tab.title, faviconURL: getFaviconURL(tab.url) }, tab.index);
  }
});

// event listener for when tabs get moved (index change)
chrome.tabs.onMoved.addListener(async (tabId, info) => {
  // get space by windowId
  const space = await getSpaceByWindow(info.windowId);

  // update tab index
  await updateTabIndex(space.id, info.fromIndex, info.toIndex);
});

// event listener for when tabs get removed
chrome.tabs.onRemoved.addListener(async (tabId, info) => {
  // do nothing if tab removed because window was closed
  if (info.isWindowClosing) return;

  // get tab info
  const tab = await chrome.tabs.get(tabId);

  // get space by windowId
  const space = await getSpaceByWindow(tab.windowId);

  // remove tab
  await removeTabFromSpace(space.id, tab.index, tab.windowId);
});

// window created/opened
chrome.windows.onCreated.addListener(async window => {
  // get space by window
  const space = await getSpaceByWindow(window.id);

  // if this window is associated with a space then do nothing
  if (space) return;

  // create new unsaved space if only 1 tab created with the window
  if (window.tabs.length === 1) {
    // tab to be added in space
    const tab: ITab = {
      url: window.tabs[0].url,
      title: window.tabs[0].title,
      faviconURL: getFaviconURL(window.tabs[0].url),
    };
    await createUnsavedSpace(window.id, [tab]);
  }

  // check if the tabs in this window are of a space (check tab urls)
  const res = await checkNewWindowTabs(window.id, [...window.tabs.map(tab => tab.url)]);
  // if the tabs in this window are part of a space, do nothing
  // window id was saved to the respective space
  if (res) return;

  // if not then create new unsaved space with all tabs

  // get all tabs in the window
  const tabs: ITab[] = window.tabs.map(tab => ({ title: tab.title, url: tab.url, faviconURL: getFaviconURL(tab.url) }));

  // create space
  await createUnsavedSpace(window.id, tabs);
});

// window removed/closed
chrome.windows.onRemoved.addListener(async windowId => {
  // get space by window
  const space = await getSpaceByWindow(windowId);

  // if the space was not saved, then delete
  if (!space.isSaved) {
    await deleteSpace(space.id);
  }
});
