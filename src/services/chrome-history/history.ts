import { ITab } from '@root/src/pages/types/global.types';
import { getCurrentTab } from '../chrome-tabs/tabs';

const getSitesFromHistory = async (maxResults = 4) => {
  const sites = await chrome.history.search({ maxResults, text: '' });

  if (sites?.length < 1) {
    return [];
  }

  if (sites.length === 1) {
    return [{ url: sites[0].url, title: sites[0].title, id: 0 }];
  }

  const currentTab = await getCurrentTab();

  console.log('🚀 ~ getRecentlyVisitedSites ~ sites:', sites);

  // remove duplicates and return site url & title

  return sites.filter(
    (s1, idx) =>
      sites.findIndex(s2 => s2.url === s1.url) === idx && s1.url !== currentTab.url && !s1.url.startsWith('chrome://'),
  );
};

// recent visited sites
export const getRecentlyVisitedSites = async (maxResults = 4): Promise<ITab[]> => {
  let sites = [];

  let i = 1;

  while (sites.length < maxResults) {
    sites = await getSitesFromHistory(maxResults * i);

    console.log(' ~ getRecentlyVisitedSites ~ 🔂 while loop ~ sites:', sites);

    i++;
  }

  return sites.map<ITab>(site => ({ url: site.url, title: site.title, id: 0 }));
};

// get top sites for chrome
export const getMostVisitedSites = async (): Promise<ITab[]> => {
  const topSites = await chrome.topSites.get();
  return topSites as ITab[];
};
