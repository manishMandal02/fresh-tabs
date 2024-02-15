// discard all other tabs (exclude audible tabs)
export const discardTabs = async () => {
  const tabs = await chrome.tabs.query({ currentWindow: true, active: false, audible: false, discarded: false });

  const tabsDiscardPromises = tabs.map(tab => chrome.tabs.discard(tab.id));

  await Promise.allSettled(tabsDiscardPromises);
};
