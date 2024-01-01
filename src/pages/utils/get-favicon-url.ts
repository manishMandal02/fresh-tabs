export const getFaviconURL = (siteURL: string) => {
  //  chrome icon as favicon
  if (!siteURL || siteURL.startsWith('chrome://')) return chrome.runtime.getURL('chrome.svg');

  const url = new URL(siteURL);
  return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}
  `;
};
