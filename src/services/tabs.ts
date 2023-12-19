// create a tab

export const createTab = async (url: string) => {
  const tab = await chrome.tabs.create({ active: false, url });

  console.log('🚀 ~ file: tabs.ts:6 ~ createTab ~ tab:', tab);
};

// opens a space in new window
export const openSpace = async (urls: string[], activeTabURL: string) => {
  //  only active tab will be loaded, rest will be loaded after user visits them

  // create new window with all the space tabs
  const window = await chrome.windows.create({ focused: true });

  if (window.id) {
    // create discarded tabs
    const discardedTabURLs = urls.filter(url => url !== activeTabURL);

    // batch all the promise to process at once (create's discarded tabs)
    const createMultipleTabs = discardedTabURLs.map((url, idx) =>
      chrome.tabs.create({ active: false, windowId: window.id, index: idx, url: `data:text/html,<title>${url}` }),
    );

    await Promise.allSettled(createMultipleTabs);

    // create active tab
    await chrome.tabs.create({
      active: true,
      url: activeTabURL,
      windowId: window.id,
      index: urls.indexOf(activeTabURL),
    });
  }
};
