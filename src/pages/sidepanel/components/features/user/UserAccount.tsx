import { useAtom } from 'jotai';

import { SlideModal } from '../../elements/modal';
import { showUserAccountModalAtom } from '@root/src/stores/app';

const testUser = {
  name: 'Manish Mandal',
  email: 'manishmandalj@gmail.com',
  profilePic: 'https://avatars.githubusercontent.com/u/76472450?v=4',
};

const UserAccount = () => {
  console.log('UserAccount ~ 🔁 rendered');

  const [showModal, setShowModal] = useAtom(showUserAccountModalAtom);

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <SlideModal title="Account" isOpen={!showModal} onClose={handleClose}>
      <div className="h-[45vh] w-full">
        {/* user info */}
        <div className="w-fit mx-auto mt-4 flex flex-col items-center">
          <img
            src={testUser.profilePic}
            alt={testUser.name}
            className="size-10 rounded-full opacity-90 border border-brand-darkBgAccent/80"
          />
          <p className="text-slate-400 text-[12px] mt-1.5 font-light">{testUser.name}</p>
          <p className="text-slate-400/90 text-[12.5px] font-light mt-px">{testUser.email}</p>
        </div>

        <div className="w-fit mx-auto mt-6 flex flex-col items-center">
          <button className="text-slate-800 text-[12px] font-medium bg-brand-primary rounded px-8 py-1.5 mt-2">
            Manage Plan
          </button>
        </div>
      </div>
    </SlideModal>
  );
};

export default UserAccount;
