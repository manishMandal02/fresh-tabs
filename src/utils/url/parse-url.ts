import { DISCARD_TAB_URL_PREFIX } from '@root/src/constants/app';

import { logger } from '../logger';

// get tab url from html in url for discarded tabs
export const getUrlFromHTML = (htmlString: string) => {
  // regex to get url from html
  const regexPattern = /\/\/{\[(.*?)\]}\/\//g;

  const matches = decodeURIComponent(htmlString).match(regexPattern) || [];

  if (matches.length < 1) {
    logger.error({
      error: new Error('Failed to get url link from html for discarded tab'),
      msg: 'Failed to get link.',
    });
  }

  // get the full link from replacing any unwanted char
  return matches[0].replace(/\/\/{\[|\]}\/\//g, '');
};

// parse discard url
export const parseUrl = (url: string) => {
  if (url?.startsWith(DISCARD_TAB_URL_PREFIX)) {
    return getUrlFromHTML(url);
  }

  return url.startsWith('http') ? url : `https://${url}`;
};
