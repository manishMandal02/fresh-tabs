import { ITab } from '@root/src/pages/types/global.types';
import { getCurrentTab } from '../chrome-tabs/tabs';

// recent visited sites
export const getRecentlyVisitedSites = async (maxResults = 4): Promise<ITab[]> => {
  const sites = await chrome.history.search({ maxResults, text: '' });

  if (sites?.length < 1) {
    return [];
  }

  if (sites.length === 1) {
    return [{ url: sites[0].url, title: sites[0].title, id: 0 }];
  }

  const currentTab = await getCurrentTab();

  const currentSiteIndex = sites.findIndex(site => site.url === currentTab.url);

  console.log('🚀 ~ getRecentlyVisitedSites ~ currentSiteIndex:', currentSiteIndex);

  if (currentSiteIndex !== -1) {
    sites.splice(currentSiteIndex, 1);
  } else {
    sites.pop();
  }

  // remove duplicates and return site url & title

  return sites
    .filter(s1 => sites.find(s2 => s2.url === s1.url))
    .map(site => ({ url: site.url, title: site.title, id: 0 }));
};

// get top sites for chrome
export const getMostVisitedSites = async (): Promise<ITab[]> => {
  const topSites = await chrome.topSites.get();
  return topSites as ITab[];
};
