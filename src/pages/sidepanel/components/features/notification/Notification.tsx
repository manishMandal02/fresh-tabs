import { useAtom } from 'jotai';

import { SlideModal } from '../../../../../components/modal';
import { showNotificationModalAtom } from '@root/src/stores/app';

const Notification = () => {
  console.log('Footer ~ 🔁 rendered');

  const [showModal, setShowModal] = useAtom(showNotificationModalAtom);

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <SlideModal title="Your Notifications" isOpen={showModal} onClose={handleCloseModal}>
      <div className=" flex flex-col  w-full h-full py-1 px-4">
        <p className="text-[14px] font-medium text-slate-400 my-1">Today </p>
        <span className="text-[12px] font-light text-slate-400 mx-auto">No new notification</span>
      </div>
    </SlideModal>
  );
};

export default Notification;
