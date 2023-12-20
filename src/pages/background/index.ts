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
