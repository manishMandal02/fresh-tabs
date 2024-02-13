import { parseURL } from '@root/src/pages/utils/parseURL';
const createChromeFaviconURL = (url: URL) => `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${url.origin}/&size=32`;

const googleFaviconURL = (url: URL) => `https://www.google.com/s2/favicons?domain=${url.hostname}&sz=${32}`;

export const getFaviconURL = (siteURL: string, isSidePanel = true) => {
  //  chrome icon as favicon

  const parsedURL = parseURL(siteURL);

  const url = new URL(parsedURL);

  if (!siteURL || siteURL.startsWith('chrome://')) return createChromeFaviconURL(url);
  const subdomainRegex =
    /(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})?/;

  let faviconURL = '';

  if (!isSidePanel) {
    //  TODO - some sub domains like google products don't work,
    // need to check if the image was loaded if not then try diff method

    // return url.origin + '/favicon.ico';
    return googleFaviconURL(url);
  }

  // generate favicon link with chrome favicon url if subdomain else use google global favicon url
  if (subdomainRegex.test(url.origin) && url.hostname.split('.')[0] !== 'www') {
    faviconURL = createChromeFaviconURL(url);
  } else {
    faviconURL = googleFaviconURL(url);
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
