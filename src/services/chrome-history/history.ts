import { ITab } from '@root/src/pages/types/global.types';
import { getCurrentTab } from '../chrome-tabs/tabs';

// recent visited sites
export const getRecentlyVisitedSites = async (maxResults = 4): Promise<ITab[]> => {
  const sites = await chrome.history.search({ maxResults, text: '' });

  const currentTab = await getCurrentTab();

  const currentSiteIndex = sites.findIndex(site => site.url === currentTab.url);

  console.log('🚀 ~ getRecentlyVisitedSites ~ currentSiteIndex:', currentSiteIndex);

  if (currentSiteIndex !== -1) {
    sites.splice(currentSiteIndex, 1);
  } else {
    sites.pop();
  }

  return sites.map(site => ({ url: site.url, title: site.title, id: 0 }));
};

// get top sites for chrome
export const getMostVisitedSites = async (): Promise<ITab[]> => {
  const topSites = await chrome.topSites.get();
  return topSites as ITab[];
};
