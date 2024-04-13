import { isChromeUrl } from './check-chrome-url';
import { parseUrl } from './parse-url';

export const getFaviconURL = (siteUrl: string, size = 32) => {
  const parsedUrl = parseUrl(siteUrl);

  const url = new URL(parsedUrl) || new URL(siteUrl);

  if (!url || isChromeUrl(siteUrl)) return createChromeFaviconURL(url);

  return `https://api.faviconkit.com/${url.hostname}/${size}`;
};

const createChromeFaviconURL = (url: URL) => `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${url.origin}/&size=32`;

// !Note - previous method

// const googleFaviconURL = (url: URL) => `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}`;

// export const getFaviconURL = (siteUrl: string, isSidePanel = true) => {
//   //  chrome icon as favicon

//   const parsedUrl = parseUrl(siteUrl);

//   const url = new URL(parsedUrl) || new URL(siteUrl);

//   if (!siteUrl || isChromeUrl(siteUrl)) return createChromeFaviconURL(url);
//   const subdomainRegex =
//     /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

//   let faviconUrl = '';

//   if (!isSidePanel) {
//     //  TODO - some sub domains like google products don't work,
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
