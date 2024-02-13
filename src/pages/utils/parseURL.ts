import { DiscardTabURLPrefix } from '@root/src/constants/app';

import { logger } from './logger';

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
export const parseURL = (url: string) => {
  if (url?.startsWith(DiscardTabURLPrefix)) {
    return getUrlFromHTML(url);
  }

  return url;
};
