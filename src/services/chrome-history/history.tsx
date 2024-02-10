// recent visited sites

import { ITab } from '@root/src/pages/types/global.types';

export const recentlyVisitedSites = async (maxResults = 3): Promise<ITab[]> => {
  const sites = await chrome.history.search({ maxResults, text: '' });
  return sites.map(site => ({ url: site.url, title: site.title, id: 0 }));
};
