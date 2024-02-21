import { isChromeUrl } from './check-chrome-url';
import { parseUrl } from './parse-url';
const createChromeFaviconURL = (url: URL) => `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${url.origin}/&size=32`;

const googleFaviconURL = (url: URL) => `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}`;

export const getFaviconURL = (siteUrl: string, isSidePanel = true) => {
  //  chrome icon as favicon

  const parsedUrl = parseUrl(siteUrl);

  const url = new URL(parsedUrl);

  if (!siteUrl || isChromeUrl(siteUrl)) return createChromeFaviconURL(url);
  const subdomainRegex =
    /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

  let faviconUrl = '';

  if (!isSidePanel) {
    //  TODO - some sub domains like google products don't work,
    // need to check if the image was loaded if not then try diff method

    // return url.origin + '/favicon.ico';
    return googleFaviconURL(url);
  }

  // generate favicon link with chrome favicon url if subdomain else use google global favicon url
  if (subdomainRegex.test(url.origin) && url.hostname.split('.')[0] !== 'www') {
    faviconUrl = createChromeFaviconURL(url);
  } else {
    faviconUrl = googleFaviconURL(url);
  }

  // the above solution seems to be working for now

  // check if favicon url is correct
  // (async () => {
  //   try {
  //     const response = await fetch(faviconUrl, { method: 'HEAD', mode: 'no-cors' });

  //     console.log('🚀 ~ response:', response);

  //     if (response.ok) {
  //       // Check if the content type is an image
  //       const contentType = response.headers.get('content-type');
  //       if (contentType?.startsWith('image/')) {
  //         return faviconUrl;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error checking favicon:', error);
  //     return faviconUrl;
  //   }
  //   return faviconUrl;
  // })();
  return faviconUrl;
};
