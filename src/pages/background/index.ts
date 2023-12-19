import reloadOnUpdate from 'virtual:reload-on-update-in-background-script';
import 'webextension-polyfill';

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
  const splitText = 'data:text/html,<title>';

  console.log('🚀 ~ file: index.ts:26 ~ chrome.tabs.onActivated.addListener ~ splitText:', splitText);

  chrome.tabs.get(tabId, tab => {
    if (tab.url.startsWith(splitText)) {
      const realTabUrl = tab.url.replace(splitText, '');

      chrome.tabs.update(tabId, {
        url: realTabUrl,
      });
    }
  });
});
