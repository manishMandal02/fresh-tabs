import { parseURL } from '@root/src/pages/utils/parseURL';
const createChromeFaviconUrl = (url: URL) => `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${url.origin}/&size=32`;

export const getFaviconURL = (siteURL: string) => {
  //  chrome icon as favicon

  const parsedURL = parseURL(siteURL);

  const url = new URL(parsedURL);

  if (!siteURL || siteURL.startsWith('chrome://')) return createChromeFaviconUrl(url);
  const subdomainRegex =
    /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

  let faviconURL = '';

  // generate favicon link with chrome favicon url if subdomain else use google global favicon url
  if (subdomainRegex.test(url.origin) && url.hostname.split('.')[0] !== 'www') {
    faviconURL = createChromeFaviconUrl(url);
  } else {
    faviconURL = `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}`;
  }

  // the above solution seems to be working for now

  // check if favicon url is correct
  // (async () => {
  //   try {
  //     const response = await fetch(faviconURL, { method: 'HEAD', mode: 'no-cors' });

  //     console.log('🚀 ~ response:', response);

  //     if (response.ok) {
  //       // Check if the content type is an image
  //       const contentType = response.headers.get('content-type');
  //       if (contentType?.startsWith('image/')) {
  //         return faviconURL;
  //       }
  //     }
  //   } catch (error) {
  //     console.error('Error checking favicon:', error);
  //     return faviconURL;
  //   }
  //   return faviconURL;
  // })();
  return faviconURL;
};
