import { logger } from '@root/src/utils/logger';
import { getAppSettings } from '../chrome-storage/settings';
import { getUrlDomain } from '@root/src/utils';

// discard all other tabs (exclude audible tabs)
export const discardAllTabs = async (autoDiscard = false, ignoreWhitelist = true) => {
  try {
    let tabs = await chrome.tabs.query({
      active: false,
      discarded: false,
      status: 'complete',
      ...(autoDiscard && { audible: false }),
    });

    if (autoDiscard) {
      const { autoDiscardTabs } = await getAppSettings();

      tabs = tabs.filter(
        //@ts-expect-error - lastAccesses is a newly added feature (the types are not updated)
        tab => !!tab?.lastAccessed && !autoDiscardTabs.whitelistedDomains.includes(getUrlDomain(tab.url)),
      );

      if (tabs.length > 0) {
        // calculate minimum idle time for tabs to be discarded as per user preference
        const minimumIdleTime = autoDiscardTabs.discardTabAfterIdleTime * 60 * 1000;
        //@ts-expect-error - new feature (the types are not updated)
        tabs = tabs.filter(tab => tab?.lastAccessed <= Date.now() - minimumIdleTime);
      }
    }

    if (!ignoreWhitelist) {
      const { autoDiscardTabs } = await getAppSettings();

      tabs = tabs.filter(tab => !autoDiscardTabs.whitelistedDomains.includes(getUrlDomain(tab.url)));
    }

    if (tabs.length < 1) return true;

    const tabsDiscardPromises = tabs.map(tab => chrome.tabs.discard(tab.id));

    await Promise.allSettled(tabsDiscardPromises);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error discarding tabs`,
      fileTrace: 'src/services/chrome-discard/discard.ts:19 ~ discardAllTabs() ~ catch block',
    });
    return false;
  }
};

export const discardTabs = async (tabIDs: number[]) => {
  try {
    if (tabIDs?.length < 2) {
      await chrome.tabs.discard(tabIDs[0]);
      return true;
    }

    const tabsDiscardPromises = tabIDs.map(id => chrome.tabs.discard(id));

    await Promise.allSettled(tabsDiscardPromises);
    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error discarding tabs`,
      fileTrace: 'src/services/chrome-discard/discard.ts:51 ~ discardTabs() ~ catch block',
    });
    return false;
  }
};
