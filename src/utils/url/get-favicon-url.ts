import { isChromeUrl } from './check-chrome-url';
import { parseUrl } from './parse-url';

const createChromeFaviconURL = (url: URL) => `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${url.origin}/&size=32`;

export const getFaviconURL = (siteUrl: string, size = 32) => {
  const parsedUrl = parseUrl(siteUrl);

  const url = new URL(parsedUrl) || new URL(siteUrl);

  console.log('🚀 ~ getFaviconURL ~ siteUrl:', siteUrl);

  if (!url.hostname || isChromeUrl(siteUrl)) return createChromeFaviconURL(url);

  return `https://www.google.com/s2/favicons?domain=${url.hostname}/${url.pathname.split('/')[1]}&sz=${size}`;
};

export const getAlternativeFaviconUrl = (siteUrl: string, size = 32) => {
  const url = new URL(siteUrl);

  //  get favicon url from favicon kit, if couldn't get it from google
  return `https://api.faviconkit.com/${url.hostname}/${size}`;
};

// validates favicon urls and returns an alternate src url if google favicon url is not correct
export const getFaviconURLAsync = async (siteUrl: string, size = 32) => {
  const parsedUrl = parseUrl(siteUrl);

  const url = new URL(parsedUrl) || new URL(siteUrl);

  if (!url.hostname || isChromeUrl(siteUrl)) return createChromeFaviconURL(url);

  const googleFaviconURL = `https://www.google.com/s2/favicons?domain=${url.hostname}/${
    url.pathname.split('/')[1]
  }&sz=${size}`;

  const res = await fetch(googleFaviconURL);

  if (res.ok) {
    return googleFaviconURL;
  } else {
    return getAlternativeFaviconUrl(siteUrl);
  }
};

// !Note - previous method
// export const getFaviconURL = (siteUrl: string, isSidePanel = true) => {
//   //  chrome icon as favicon

//   const parsedUrl = parseUrl(siteUrl);

//   const url = new URL(parsedUrl) || new URL(siteUrl);

//   if (!siteUrl || isChromeUrl(siteUrl)) return createChromeFaviconURL(url);
//   const subdomainRegex =
//     /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

//   let faviconUrl = '';

//   if (!isSidePanel) {
//     // need to check if the image was loaded if not then try diff method

//     // return url.origin + '/favicon.ico';
//     return googleFaviconURL(url);
//   }

//   // generate favicon link with chrome favicon url if subdomain else use google favicon urls
//   if (subdomainRegex.test(url.origin) && url.hostname?.split('.')[0] !== 'www') {
//     faviconUrl = createChromeFaviconURL(url);

//     console.log('🚀 ~ getFaviconURL ~ faviconUrl:', faviconUrl);
//   } else {
//     faviconUrl = googleFaviconURL(url);
//   }

//   return faviconUrl;
// };
