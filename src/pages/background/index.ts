import { ITab } from './../types/global.types';
import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { getUrlFromHTML } from '../utils/get-url-from-html';
import {
  checkNewWindowTabs,
  createUnsavedSpace,
  deleteSpace,
  getSpaceByWindow,
  updateActiveTabInSpace,
} from '@root/src/services/chrome-storage/spaces';
import { removeTabFromSpace, updateTab, updateTabIndex } from '@root/src/services/chrome-storage/tabs';
import { getFaviconURL } from '../utils';

reloadOnUpdate('pages/background');

/**
 * Extension reloading is necessary because the browser automatically caches the css.
 * If you do not use the css of the content script, please delete it.
 */
reloadOnUpdate('pages/content/style.scss');

console.log('background loaded');

// open side panel on extension icon clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(error => console.error(error));

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

    //  create new  or update tab
    await updateTab(space.id, { url: tab.url, title: tab.title, faviconURL: getFaviconURL(tab.url) }, tab.index);
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
chrome.tabs.onRemoved.addListener(async tabId => {
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
