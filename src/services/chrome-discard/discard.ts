import { logger } from '@root/src/pages/utils/logger';

// discard all other tabs (exclude audible tabs)
export const discardTabs = async (autoDiscard = false) => {
  try {
    //TODO - take user preferences into consideration
    let tabs = await chrome.tabs.query({ active: false, audible: false, discarded: false });

    if (autoDiscard) {
      //@ts-expect-error - lastAccesses is a newly added feature (the types are not updated)
      tabs = tabs.filter(tab => tab?.lastAccessed);

      console.log('🚀 ~ discardTabs ~ tabs with lastAccessed available:', tabs);

      if (tabs.length > 0) {
        const TENMinutes = 600000;
        //@ts-expect-error - new feature (the types are not updated)
        tabs = tabs.filter(tab => tab?.lastAccessed <= Date.now() - TENMinutes);

        console.log('🚀 ~ discardTabs ~ tabs accessed over 10mins ago. ⏳', tabs);
      }
    }

    if (tabs.length < 1) return true;

    const tabsDiscardPromises = tabs.map(tab => chrome.tabs.discard(tab.id));

    await Promise.allSettled(tabsDiscardPromises);

    return true;
  } catch (error) {
    logger.error({
      error,
      msg: `Error discarding tabs`,
      fileTrace: 'src/services/chrome-discard/discard.ts:19 ~ discardTabs() ~ catch block',
    });
    return false;
  }
};
