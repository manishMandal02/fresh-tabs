import { useAtom } from 'jotai';

import { SlideModal } from '../../../../../components/modal';
import { showUserAccountModalAtom } from '@root/src/stores/app';

const testUser = {
  name: 'Manish Mandal',
  email: 'manishmandalj@gmail.com',
  profilePic: 'https://avatars.githubusercontent.com/u/76472450?v=4',
};

const SUBSCRIPTION_PLAN = {
  lifeTime: 'LifeTime',
  monthly: 'Monthly',
  yearly: 'Yearly',
} as const;

const UserAccount = () => {
  console.log('UserAccount ~ 🔁 rendered');

  const [showModal, setShowModal] = useAtom(showUserAccountModalAtom);

  const handleClose = () => {
    setShowModal(false);
  };

  return (
    <SlideModal title="Account" isOpen={showModal} onClose={handleClose}>
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
          <div className="bg-brand-darkBgAccent/40 px-3 pt-2.5 pb-3.5 rounded-md min-w-60 text-slate-400/80">
            <p className="text-slate-400 text-[13px] font-medium text-left ml-px">Your Subscription Plan</p>
            <div className="flex items-center justify-between mt-3">
              <p className="font-light text-slate-400/80">Subscription</p>
              <span className="w-fit">{SUBSCRIPTION_PLAN.lifeTime}</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className=" font-light text-slate-400/80">Price</p>
              <span className="w-fit">49 USD</span>
            </div>
          </div>
          <button
            className="text-slate-800 text-[12px] font-medium bg-brand-primary rounded px-8 py-2 mt-4 disabled:cursor-not-allowed disabled:text-slate-500 disabled:bg-brand-darkBgAccent"
            disabled>
            Manage Plan
          </button>
        </div>
      </div>
    </SlideModal>
  );
};

export default UserAccount;
