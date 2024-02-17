// show notification
export const showUnSnoozedNotification = (
  spaceId: string,
  title: string,
  message: string,
  iconUrl: string,
  isSameSpace = false,
) => {
  let buttons: chrome.notifications.ButtonOptions[] = [{ title: 'Go to tab' }];
  let notificationId = `snoozed-tab-active-space`;

  if (!isSameSpace) {
    buttons = [{ title: 'Open tab' }, { title: 'Open space' }];
    notificationId = `snoozed-tab-for-${spaceId}`;
  }

  chrome.notifications.create(notificationId, {
    title,
    message,
    iconUrl,
    buttons,
    type: 'basic',
    silent: false,
  });
};
