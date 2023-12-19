// create a tab

export const createTab = async (url: string) => {
  const tab = await chrome.tabs.create({ active: false, url });

  console.log('🚀 ~ file: tabs.ts:6 ~ createTab ~ tab:', tab);
};

// opens a space in new window
export const openSpace = async (urls: string[], activeTabURL: string) => {
  // create new window with all the space tabs
  const window = await chrome.windows.create({ focused: true, url: urls });

  if (activeTabURL) {
    const activeTab = window.tabs.find(tab => tab.pendingUrl === activeTabURL);

    if (activeTab) {
      await chrome.tabs.update(activeTab.id, { active: true });
    }
  }

  // discard tabs
  if (urls.length > 2 && activeTabURL) {
    // discard tabs all tabs except the last active tab in space
    const newTabs = window.tabs.filter(tab => tab.pendingUrl !== activeTabURL).map(t => t.id);

    // batch all the promise to process at once (discard fn )
    const updateMultipleTabFn = newTabs.map(tab => chrome.tabs.discard(tab));

    const res = await Promise.allSettled(updateMultipleTabFn);

    console.log('🚀 ~ file: tabs.ts:36 ~ openSpace ~ res:', res);
  }
};
