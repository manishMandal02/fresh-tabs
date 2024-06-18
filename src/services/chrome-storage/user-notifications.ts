import { getStorage, setStorage } from './helpers';
import { INotification } from '@root/src/types/global.types';

export const getAllNotifications = async () => {
  const allNotifications = await getStorage<INotification[]>({ type: 'local', key: 'NOTIFICATIONS' });
  return allNotifications || [];
};
export const setNotifications = async (notifications: INotification[]) => {
  const allNotifications = await setStorage({ type: 'local', key: 'NOTIFICATIONS', value: notifications });
  return allNotifications;
};

export const addNotification = async (notification: INotification) => {
  const allNotifications = await getAllNotifications();
  await setNotifications([...(allNotifications || []), notification]);
  return true;
};

export const deleteNotification = async (id?: string, clearAll = false) => {
  // clear all notifications
  if (clearAll) {
    await setNotifications([]);
    return true;
  }
  // delete a notification
  const allNotifications = await getAllNotifications();
  const updatedNotifications = allNotifications.filter(notification => notification.id !== id);
  await setNotifications(updatedNotifications);
  return true;
};
