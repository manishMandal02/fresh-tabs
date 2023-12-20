import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';
import { getUrlFromHTML } from '../utils/get-url-from-html';

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
chrome.tabs.onActivated.addListener(({ tabId }) => {
  const splitText = 'data:text/html,';

  // update tab with original link if it was discarded
  chrome.tabs.get(tabId, tab => {
    // check if this was discarded
    if (tab.url.startsWith(splitText)) {
      // get url from html in the url
      const url = getUrlFromHTML(tab.url.replace(splitText, ''));

      // update tab with original url
      (async () => {
        await chrome.tabs.update(tabId, {
          url,
        });
      })();
    }
  });
});

// chrome.tabs.onCreated.addListener(tab => {
//   console.log('🚀 ~ file: index.ts:45 ~ ~ tab: onCreated', tab);
// });

// event listener for when tabs get updated
chrome.tabs.onUpdated.addListener(async (tabId, info) => {
  if (info?.status === 'complete') {
    const tab = await chrome.tabs.get(tabId);
    console.log('🚀 ~ file: index.ts:52 ~ chrome.tabs.onUpdated.addListener ~ tab: ☘️ status changed', tab);
  }

  if (info?.url) {
    const tab = await chrome.tabs.get(tabId);
    console.log('🚀 ~ file: index.ts:52 ~ chrome.tabs.onUpdated.addListener ~ tab: ☘️ url changed', tab);
    // todo - update this tab in storage
  }
});

// // event listener for when tabs get removed
// chrome.tabs.onRemoved.addListener(async (tabId, info) => {});

// // event listener for when tabs get moved (index change)
// chrome.tabs.onMoved.addListener(async (tabId, info) => {});
