// chrome-scripting

// set local storage data to content script of a tab
const setLocalStorageFn = (data: string) => {
  if (!data) {
    localStorage.clear();
    return;
  }
  const parsedData = JSON.parse(data);
  Object.keys(parsedData).forEach(function (key) {
    localStorage.setItem(key, JSON.stringify(parsedData[key]));
  });
};

export const setLocalStorageContentScript = async (tabId: number, data: string) => {
  if (!data) throw new Error('setLocalStorageContentScript() ~ no data provided.');

  chrome.scripting.executeScript({
    target: { tabId },
    func: setLocalStorageFn,
    args: [data],
  });

  return true;
};

// get local storage data from content script of a tab
const getLocalStorageFn = () => {
  const localStorageData = JSON.stringify(localStorage);
  localStorage.clear();
  return localStorageData;
};

export const getLocalStorageContentScript = async (tabId: number) => {
  const localStorageData = await chrome.scripting.executeScript({
    target: { tabId },
    func: getLocalStorageFn,
  });

  if (!localStorageData) throw new Error('getLocalStorageContentScript() ~ failed to get localStorage data.');

  return localStorageData[0].result;
};
