import { ITab } from '@root/src/pages/types/global.types';
import { getCurrentTab } from '../chrome-tabs/tabs';
import { logger } from '@root/src/pages/utils/logger';

const getSitesFromHistory = async (maxResults: number) => {
  const sites = await chrome.history.search({ maxResults, text: '' });

  if (sites?.length < 1) {
    return [];
  }

  if (sites.length === 1) {
    return [{ url: sites[0].url, title: sites[0].title, id: 0 }];
  }

  const currentTab = await getCurrentTab();

  // remove duplicates and return site url & title

  return sites.filter((s1, idx) => {
    if (
      sites.findIndex(s2 => s2.title === s1.title) === idx &&
      s1.url !== currentTab?.url &&
      !s1.url.startsWith('chrome://')
    ) {
      return true;
    } else {
      return false;
    }
  });
};

// recent visited sites
export const getRecentlyVisitedSites = async (maxResults = 4): Promise<ITab[]> => {
  try {
    let sites = [];

    let i = 1;

    while (sites.length < maxResults) {
      sites = await getSitesFromHistory(Math.ceil((maxResults * i) / 2));

      i++;
    }

    return sites.map<ITab>(site => ({ url: site.url, title: site.title, id: 0 }));
  } catch (error) {
    logger.error({
      error,
      msg: 'Failed to recent sites form history.',
      fileTrace: 'src/services/chrome-history/history.ts:53 ~ getRecentlyVisitedSites() ~ catch block',
    });
    return [];
  }
};

// TODO - not used currently
// get top sites for chrome
export const getMostVisitedSites = async (): Promise<ITab[]> => {
  const topSites = await chrome.topSites.get();
  return topSites as ITab[];
};
