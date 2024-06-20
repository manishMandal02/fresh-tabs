import { NOTIFICATION_TYPE, SNOOZED_TAB_GROUP_TITLE } from '@root/src/constants/app';
import { ISpace } from '@root/src/types/global.types';
import { generateId, logger, publishEvents } from '@root/src/utils';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { showUnSnoozedNotification } from '@root/src/services/chrome-notification/notification';
import { getTabToUnSnooze, removeSnoozedTab } from '@root/src/services/chrome-storage/snooze-tabs';
import { getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { newTabGroup } from '@root/src/services/chrome-tabs/tabs';
import { addNotification } from '@root/src/services/chrome-storage/user-notifications';

export const handleSnoozedTabAlarm = async (alarmName: string) => {
  //  un-snooze tab
  // extract space id from name (tab was snoozed from this space)
  const spaceId = alarmName.split('-')[1];

  // get the snoozed tab info
  const { url, title, faviconUrl, snoozedAt } = await getTabToUnSnooze(spaceId);

  // add to user notifications
  await addNotification({
    timestamp: Date.now(),
    id: generateId(),
    type: NOTIFICATION_TYPE.UN_SNOOZED_TAB,
    snoozedTab: {
      url,
      title,
      faviconUrl,
    },
  });

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
    //tab snoozed by current active space, open snoozed tab in new group

    // create a group for snoozed tab
    await newTabGroup(SNOOZED_TAB_GROUP_TITLE, url, currentSpace.windowId);

    // remove the tab from the snoozed storage
    await removeSnoozedTab(spaceId, snoozedAt);
  }

  const isSameSpace = !!currentSpace.id;

  // show notification with show tab button or also show open tab/space button if not same space
  showUnSnoozedNotification(spaceId, `⏰ Tab Snoozed ${getTimeAgo(snoozedAt)}`, title, faviconUrl, isSameSpace);

  // send send to side panel
  await publishEvents({
    id: generateId(),
    event: 'UPDATE_NOTIFICATIONS',
    payload: {
      spaceId: spaceId,
    },
  });

  logger.info('✅ un-snoozed tab successfully');
  return;
};
