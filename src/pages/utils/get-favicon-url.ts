export const getFaviconURL = (siteURL: string) => {
  //  chrome icon as favicon
  if (!siteURL || siteURL.startsWith('chrome://')) return chrome.runtime.getURL('chrome.svg');

  const url = new URL(siteURL);

  const subdomainRegex =
    /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

  if (subdomainRegex.test(url.origin) && url.hostname.split('.')[0] !== 'www') {
    return `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${url.origin}/&size=32`;
  } else {
    return `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}`;
  }
};
