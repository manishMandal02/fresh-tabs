import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { CounterClockwiseClockIcon, GlobeIcon, Pencil1Icon, PersonIcon, TrashIcon } from '@radix-ui/react-icons';

import Tooltip from '@root/src/components/tooltip';
import { NOTIFICATION_TYPE } from '@root/src/constants/app';
import { INotification } from '@root/src/types/global.types';
import { SlideModal } from '../../../../../components/modal';
import { deleteNotification } from '@root/src/services/chrome-storage/user-notifications';
import { getISODate, getReadableDate, getTimeAgo, getUrlDomain, getWeekday, limitCharLength } from '@root/src/utils';
import {
  showNoteModalAtom,
  userNotificationsAtom,
  showUserAccountModalAtom,
  showNotificationModalAtom,
} from '@root/src/stores/app';

const mapNotification = (notifications: INotification[]) => {
  const sortedNotifications = notifications.sort((a, b) => {
    if (a.timestamp < b.timestamp) return 1;
    if (a.timestamp > b.timestamp) return -1;
    return 0;
  });

  return sortedNotifications.reduce(
    (acc, curr) => {
      const dateKey = getISODate(curr.timestamp);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(curr);
      return acc;
    },
    {} as Record<string, INotification[]>,
  );
};

const Notification = () => {
  console.log('Notification ~ 🔁 rendered');

  //  global state

  // notification modal state
  const [showModal, setShowModal] = useAtom(showNotificationModalAtom);
  // all user notification
  const [allNotifications, setAllNotifications] = useAtom(userNotificationsAtom);

  const setShowUserAccountModal = useSetAtom(showUserAccountModalAtom);
  const setShowNoteModal = useSetAtom(showNoteModalAtom);

  // local strate
  const [notifications, setNotifications] = useState<Record<string, INotification[]>>({});

  const handleCloseModal = () => {
    setShowModal(false);
  };

  useEffect(() => {
    if (!showModal) return;
    const mappedNotifications = mapNotification(allNotifications);

    setNotifications(mappedNotifications);
  }, [showModal, allNotifications]);

  //  delete notification
  const handleDeleteNotification = async (id: string, closeModal = false) => {
    setAllNotifications(allNotifications.filter(notification => notification.id !== id));
    if (closeModal) {
      handleCloseModal();
    }
    await deleteNotification(id);
  };

  // delete all notifications
  const clearAllNotifications = async () => {
    await deleteNotification(null, true);
    setAllNotifications([]);
  };

  //  on notification click
  const handleNotificationClick = async (notification: INotification) => {
    switch (notification.type) {
      case NOTIFICATION_TYPE.NOTE_REMAINDER: {
        // open note
        setShowNoteModal({ show: true, note: { id: notification.note.id } });
        await handleDeleteNotification(notification.id, true);
        break;
      }
      case NOTIFICATION_TYPE.UN_SNOOZED_TAB: {
        // go to/open tab
        const [tab] = await chrome.tabs.query({ url: notification.snoozedTab.url, currentWindow: true });
        if (tab) {
          await chrome.tabs.update(tab.id, { active: true });
        } else {
          await chrome.tabs.create({ url: notification.snoozedTab.url, active: true });
        }
        await handleDeleteNotification(notification.id, true);
        break;
      }
      default: {
        // open user account modal
        setShowUserAccountModal(true);
        await handleDeleteNotification(notification.id, true);
      }
    }
  };

  // notification title based on type
  const notificationTitle = (notification: INotification) => {
    let title = '';
    if (notification.type === NOTIFICATION_TYPE.ACCOUNT) title = notification.title;
    if (notification.type === NOTIFICATION_TYPE.NOTE_REMAINDER) title = notification.note.title;
    if (notification.type === NOTIFICATION_TYPE.UN_SNOOZED_TAB) title = notification.snoozedTab.title;

    return limitCharLength(title, 42);
  };

  // notification icon based on type
  const notificationIcon = (notification: INotification) => {
    if (notification.type === NOTIFICATION_TYPE.NOTE_REMAINDER) {
      return (
        <Pencil1Icon className="scale-[2] text-slate-500/80 rounded-full bg-brand-darkBgAccent/40 p-[2.5px] border border-brand-darkBg/40" />
      );
    }

    if (notification.type === NOTIFICATION_TYPE.UN_SNOOZED_TAB) {
      return (
        <img
          src={notification.snoozedTab.faviconUrl}
          alt="site-icon"
          className="size-[16px] rounded-md bg-brand-darkBgAccent/15 object-center object-scale-down"
        />
      );
    }

    return (
      <PersonIcon className="scale-[2] text-slate-500/80 rounded-full bg-brand-darkBgAccent/40 p-[2.5px] border border-brand-darkBg/40" />
    );
  };

  // notification domain name for note remainder & snoozed tab
  const notificationSiteDomain = (notification: INotification) => {
    if (notification.type === NOTIFICATION_TYPE.ACCOUNT) return null;

    const domain =
      notification.type === NOTIFICATION_TYPE.NOTE_REMAINDER
        ? notification.note.domain
        : notification.type === NOTIFICATION_TYPE.UN_SNOOZED_TAB
          ? getUrlDomain(notification.snoozedTab.url)
          : '';

    return (
      <div className="flex items-center bg-brand-darkBgAccent/35 border border-brand-darkBg/30  w-fit px-1.5 py-[3px] rounded-md ml-1">
        <GlobeIcon className="scale-[.7] text-slate-500 mr-[2px]" />
        <Tooltip label={domain.length > 28 ? domain : ''}>
          <span className="font-light text-[9px] text-slate-400">{limitCharLength(domain, 28)}</span>
        </Tooltip>
      </div>
    );
  };

  return (
    <SlideModal title="Your Notifications" isOpen={showModal} onClose={handleCloseModal}>
      <div className="relative min-h-[35vh] max-h-full overflow-y-auto cc-scrollbar pt-1.5">
        {allNotifications.length > 0 ? (
          <button
            onClick={clearAllNotifications}
            className={`absolute top-1.5 right-1.5 flex item-center text-[10px] text-slate-500 font-semibold rounded pl-[2.5px] pr-[8px] py-[2px]
                    bg-brand-darkBgAccent/50 transition-colors duration-300 hover:bg-brand-darkBgAccent/40 hover:text-slate-400/70`}>
            <TrashIcon className="scale-[0.75] text-slate-500/80 mr-[1px]" />
            Clear All
          </button>
        ) : null}
        {allNotifications.length > 0 &&
          Object.entries(notifications).map(([date, dateNotification]) => {
            return (
              <div key={date} className=" flex flex-col  w-full h-full py-1 px-2">
                <p className="text-[12px] font-medium text-slate-400/70 mb-[2.5px]">
                  {getISODate(date) === getISODate(new Date()) ? 'Today •' : ''} {'  '} {getWeekday(new Date(date))}
                  {'  '}
                  {getReadableDate(date)}{' '}
                </p>
                {/* notifications for date */}
                {dateNotification.map(notification => (
                  <button
                    tabIndex={-1}
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className="relative w-full flex items-center bg-brand-darkBgAccent/25 px-3 py-[3.5px] rounded-lg mb-2 cursor-pointer group overflow-hidden shadow-sm shadow-brand-darkBgAccent/60">
                    <div className="flex w-[9%]">{notificationIcon(notification)}</div>
                    <div className="pt-[2.5px] w-[92%] bg-indigo-00">
                      <p className="text-slate-300/70 text-[12px] text-start">{notificationTitle(notification)}</p>
                      <div className="flex items-center justify-end mt-[7px]">
                        {/* notification time */}
                        <Tooltip label={new Date(notification.timestamp).toLocaleString()}>
                          <div className="flex items-center bg-brand-darkBgAccent/35 border border-brand-darkBg/30  w-fit px-1.5 py-[3px] rounded-md">
                            <CounterClockwiseClockIcon className="scale-[.7] text-slate-500 mr-[2px]" />
                            <span className="font-light text-[9px] text-slate-400">
                              {getTimeAgo(notification.timestamp)}
                            </span>
                          </div>
                        </Tooltip>
                        {/*  note site */}
                        {notificationSiteDomain(notification)}
                      </div>
                    </div>

                    {/* delete note */}
                    <button
                      onClick={ev => {
                        ev.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className={`translate-x-[34px] absolute group-hover:translate-x-0 flex items-center justify-center rounded-tr-md rounded-br-md
                               bg-brand-darkBgAccent/30 hover:bg-rose-400/50  w-[22.5px] h-full top-0 right-0  transition-all duration-300`}>
                      <TrashIcon className="text-rose-400 scale-[0.95] " />
                    </button>
                  </button>
                ))}
              </div>
            );
          })}
        {allNotifications.length < 1 ? (
          <div className=" flex flex-col  w-full h-full py-2 px-4">
            <p className="text-[12px] font-medium text-slate-400/70 ">
              {`Today • ${getWeekday(new Date())} ${getISODate(new Date())}`}
            </p>
            <p className="mt-8 text-[14px] font-light text-slate-500 mx-auto ">No new notification</p>
          </div>
        ) : null}
      </div>
    </SlideModal>
  );
};

export default Notification;
