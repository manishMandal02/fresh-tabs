export const getFaviconURL = (siteURL: string) => {
  const url = new URL(chrome.runtime.getURL('/_favicon/'));
  url.searchParams.set('pageUrl', siteURL);
  url.searchParams.set('size', '32');
  return url.toString();
};
