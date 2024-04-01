import { useAtom } from 'jotai';
import { useState } from 'react';
import { HamburgerMenuIcon, BarChartIcon, MoonIcon, BookmarkIcon, GearIcon } from '@radix-ui/react-icons';

import Popover from '../../../../../components/popover';
import Analytics from '../space/analytics/Analytics';
import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { showSettingsModalAtom, showUserAccountModalAtom, snackbarAtom } from '@root/src/stores/app';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';

// testing
const manishProfilePicUrl = 'https://avatars.githubusercontent.com/u/76472450?v=4';

const Menu = () => {
  console.log('Footer Menu ~ 🔁 rendered');

  // globals state
  const [, setSnackbar] = useAtom(snackbarAtom);
  const [, setShowSettingsModal] = useAtom(showSettingsModalAtom);
  const [, setShowUserAccountModal] = useAtom(showUserAccountModalAtom);

  // local state
  // show menu
  const [showMenu, setShowMenu] = useState(false);

  // show analytics modal
  const [showAnalytics, setShowAnalytics] = useState(false);

  // sync/save spaces to bookmarks
  const handleSaveSpacesToBM = async () => {
    setSnackbar({ show: true, isLoading: true, msg: 'Saving spaces to bookmarks' });

    await syncSpacesToBookmark();

    setSnackbar({ show: true, isLoading: false, isSuccess: true, msg: 'Saved spaces to bookmarks' });
  };

  // discard tabs
  const handleDiscardTabs = async () => {
    setSnackbar({ show: true, isLoading: true, msg: 'Discarding tabs' });

    await discardTabs();
    setSnackbar({ show: true, isLoading: false, isSuccess: true, msg: 'Discarded non active tabs' });
  };
  return (
    <>
      <Popover
        open={showMenu}
        onChange={open => setShowMenu(open)}
        content={
          <>
            {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
            <div
              onClick={() => setShowMenu(false)}
              className={`flex flex-col text-[11px] text-slate-300 font-extralight whitespace-nowrap w-[10rem] bg-brand-darkBg/95  
                             border border-brand-darkBgAccent/50 shadow rounded shadow-brand-darkBgAccent/60`}>
              <button
                className="flex items-center pl-3 py-2 border-b border-brand-darkBgAccent/20 hover:bg-brand-darkBgAccent/20 transition-all duration-200 outline-none focus-visible:bg-brand-darkBgAccent/30"
                onClick={() => setShowUserAccountModal(true)}>
                <img src={manishProfilePicUrl} alt="user" className={`mr-[8px] size-[20px] rounded-full opacity-90`} />
                Account
              </button>
              <button
                className="flex items-center pl-3 py-2 border-b border-brand-darkBgAccent/20 hover:bg-brand-darkBgAccent/20 transition-all duration-200 outline-none focus-visible:bg-brand-darkBgAccent/30"
                onClick={() => setShowAnalytics(true)}>
                <BarChartIcon className={`text-slate-600 mr-[10px] scale-[1]`} /> Analytics
              </button>
              <button
                className="flex items-center pl-3 py-2 border-b border-brand-darkBgAccent/20 hover:bg-brand-darkBgAccent/20 transition-all duration-200 outline-none focus-visible:bg-brand-darkBgAccent/30"
                onClick={handleDiscardTabs}>
                <MoonIcon className={`text-slate-600 mr-[10px] scale-[1]`} /> Discard Tabs
              </button>
              <button
                className="flex items-center pl-3 py-2 border-b border-brand-darkBgAccent/20 hover:bg-brand-darkBgAccent/20 transition-all duration-200 outline-none focus-visible:bg-brand-darkBgAccent/30"
                onClick={handleSaveSpacesToBM}>
                <BookmarkIcon className={`text-slate-600  mr-[10px] scale-[1]`} /> Save to Bookmark
              </button>
              <button
                className="flex items-center pl-3 py-2 hover:bg-brand-darkBgAccent/20 transition-all duration-200 outline-none focus-visible:bg-brand-darkBgAccent/30"
                onClick={() => setShowSettingsModal(true)}>
                <GearIcon className={`text-slate-600  mr-[10px] scale-[1]`} /> Preferences
              </button>
            </div>
          </>
        }>
        <button
          tabIndex={0}
          onClick={() => setShowMenu(true)}
          className={`size-full text-slate-500 hover:bg-brand-darkBgAccent/20 rounded-full transition-all duration-200 px-1.5
                      flex items-center justify-center focus-within:bg-brand-darkBgAccent/30 
                      ${showMenu ? 'bg-brand-darkBgAccent/30' : ''}`}>
          <HamburgerMenuIcon className="scale-[1.3]" />
        </button>
      </Popover>
      {/* modal */}
      <Analytics show={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </>
  );
};

export default Menu;
