import { useAtom } from 'jotai';
import { useEffect, useState } from 'react';
import { CounterClockwiseClockIcon, FileTextIcon, TrashIcon } from '@radix-ui/react-icons';

import { INotification } from '@root/src/types/global.types';
import { SlideModal } from '../../../../../components/modal';
import { userNotificationsAtom, showNotificationModalAtom } from '@root/src/stores/app';
import { getISODate, getReadableDate, getTimeAgo, getWeekday, limitCharLength } from '@root/src/utils';

const mapNotification = (notifications: INotification[]) => {
  return notifications.reduce(
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
  const [allNotifications] = useAtom(userNotificationsAtom);

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

  const handleNotificationClick = () => {};

  const handleDeleteNotification = (id: string) => {
    console.log('🚀 ~ handleDeleteNotification ~ id:', id);
  };

  // TODO - design the card to adapt to all the notification types note, tab and account
  // TODO - make it scrollable like notes component
  // TODO - click and delete/read action
  // TODO - clear all notifications

  return (
    <SlideModal title="Your Notifications" isOpen={showModal} onClose={handleCloseModal}>
      <div className="min-h-[35vh]">
        {allNotifications.length > 0 &&
          Object.entries(notifications).map(([date, dateNotification]) => {
            return (
              <div key={date} className=" flex flex-col  w-full h-full py-1 px-4">
                <p className="text-[12.5px] font-medium text-slate-400/90 my-1">
                  {getISODate(date) === getISODate(new Date()) ? 'Today •' : ''} {'  '} {getWeekday(new Date(date))}
                  {'  '}
                  {getReadableDate(date)}{' '}
                </p>
                {/* notifications for date */}
                {dateNotification.map(notification => (
                  <button
                    tabIndex={-1}
                    key={notification.id}
                    onClick={() => handleNotificationClick()}
                    className="relative w-full flex items-center bg-brand-darkBgAccent/25 px-3 py-[4px] rounded-lg mb-1.5 cursor-pointer group overflow-hidden shadow-sm shadow-brand-darkBgAccent/60">
                    <div className="flex ml-px mr-1.5 ">
                      <FileTextIcon className="scale-[2] text-slate-600/80 rounded-full bg-brand-darkBgAccent/50 p-[2.5px] border border-brand-darkBg/40" />
                    </div>
                    <div className="ml-1 pt-1 w-full">
                      <p className="text-slate-300/70 text-[13px] text-start">
                        {limitCharLength(notification.note.title, 42)}
                      </p>
                      <div className="flex items-center justify-end mt-3">
                        {/*  note site */}
                        <div className="flex items-center bg-brand-darkBgAccent/35 border border-brand-darkBg/30  w-fit px-1.5 py-[3.5px] rounded-md mr-1">
                          <CounterClockwiseClockIcon className="scale-[.7] text-slate-500" />
                          <span className="font-light text-[9px] text-slate-400 mr-[2px]">
                            {getTimeAgo(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* delete note */}
                    <button
                      onClick={ev => {
                        ev.stopPropagation();
                        handleDeleteNotification(notification.id);
                      }}
                      className={`translate-x-[34px] absolute group-hover:translate-x-0 flex items-center justify-center rounded-tr-md rounded-br-md
                               bg-brand-darkBgAccent/30 hover:bg-rose-400/40  w-[25px] h-full top-0 right-0  transition-all duration-300`}>
                      <TrashIcon className="text-rose-400 scale-[0.95]" />
                    </button>
                  </button>
                ))}
              </div>
            );
          })}
        {allNotifications.length < 1 ? (
          <div className=" flex flex-col  w-full h-full py-1 px-4">
            <p className="text-[14px] font-medium text-slate-400 my-1">Today </p>
            <span className="text-[12px] font-light text-slate-400 mx-auto">No new notification</span>
          </div>
        ) : null}
      </div>
    </SlideModal>
  );
};

export default Notification;
