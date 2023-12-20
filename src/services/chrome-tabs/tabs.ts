// create a tab

import { getFaviconURL } from '../../pages/utils';

export const createTab = async (url: string) => {
  await chrome.tabs.create({ active: false, url });
};

// opens a space in new window
export const openSpace = async (urls: string[], activeTabIdx: number) => {
  //  only active tab will be loaded, rest will be loaded after user visits them

  // create new window with all the space tabs
  const window = await chrome.windows.create({ focused: true });

  if (window.id) {
    // create discarded tabs
    const discardedTabURLs = urls.filter((_url, idx) => idx !== activeTabIdx);

    // TODO -  set the title instead of url
    const discardedTabHTML = (url: string) => `
    <!DOCTYPE html>
    <html>
    <head>
    <link rel="icon" href="${getFaviconURL(url)}">
    <title>${url}</title>
    <link href="//{[${url}]}//">
    </head>
    <body>
    </body>
    </html>`;

    // batch all the promise to process at once (create's discarded tabs)
    const createMultipleTabs = discardedTabURLs.map((url, idx) =>
      chrome.tabs.create({
        active: false,
        windowId: window.id,
        index: idx,
        url: `data:text/html,${encodeURIComponent(discardedTabHTML(url))}`,
      }),
    );

    await Promise.allSettled(createMultipleTabs);

    // create active tab
    await chrome.tabs.create({
      active: true,
      url: urls[activeTabIdx],
      windowId: window.id,
      index: urls.indexOf(urls[activeTabIdx]),
    });

    // TODO - save window to space
  }
};
