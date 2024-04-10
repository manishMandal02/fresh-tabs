import { SNOOZED_TAB_GROUP_TITLE } from '@root/src/constants/app';
import { ISpace } from '@root/src/types/global.types';
import { logger } from '@root/src/utils';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { showUnSnoozedNotification } from '@root/src/services/chrome-notification/notification';
import { getTabToUnSnooze, removeSnoozedTab } from '@root/src/services/chrome-storage/snooze-tabs';
import { getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { newTabGroup } from '@root/src/services/chrome-tabs/tabs';

export const handleSnoozedTabAlarm = async (alarmName: string) => {
  //  un-snooze tab
  // extract space id from name (tab was snoozed from this space)
  const spaceId = alarmName.split('-')[1];

  // get the snoozed tab info
  const { url, title, faviconUrl, snoozedAt } = await getTabToUnSnooze(spaceId);

  // check if snoozed tab's space is active
  // also check for multi space/window scenario
  let currentSpace: ISpace = null;

  const windows = await chrome.windows.getAll();

  for (const window of windows) {
    const space = await getSpaceByWindow(window.id);
    if (space?.id === spaceId) {
      currentSpace = space;
    }
  }

  if (currentSpace?.id) {
    // if yes open snoozed tab in group

    // create a group for snoozed tab
    await newTabGroup(SNOOZED_TAB_GROUP_TITLE, url, currentSpace.windowId);

    // remove the tab from the snoozed storage
    await removeSnoozedTab(spaceId, url);

    // TODO - better notification message
    // show notification with show tab button
    showUnSnoozedNotification(spaceId, `⏰ Tab Snoozed ${getTimeAgo(snoozedAt)}`, title, faviconUrl, true);
    return;
  } else {
    // if not, show notification (open tab, open space)
    showUnSnoozedNotification(spaceId, `⏰ Tab Snoozed ${getTimeAgo(snoozedAt)}`, title, faviconUrl, false);
  }
  logger.info('✅ un-snoozed tab successfully');
};
