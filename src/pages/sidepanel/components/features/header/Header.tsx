import {
  HamburgerMenuIcon,
  BarChartIcon,
  MoonIcon,
  BookmarkIcon,
  GearIcon,
  PersonIcon,
  MixerHorizontalIcon,
} from '@radix-ui/react-icons';
import { useAtom } from 'jotai';
import { useState } from 'react';

import Popover from '../../elements/popover';
import Analytics from '../space/analytics/Analytics';
import { discardTabs } from '@root/src/services/chrome-discard/discard';
import { showSettingsModalAtom, snackbarAtom } from '@root/src/stores/app';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';

// testing
const manishProfilePicUrl = 'https://avatars.githubusercontent.com/u/76472450?v=4';

const Header = () => {
  // globals state
  const [, setSnackbar] = useAtom(snackbarAtom);
  const [, setShowSettingsModal] = useAtom(showSettingsModalAtom);

  // local state
  // show menu
  const [showMenu, setShowMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

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
      <div className=" pt-3 flex items-center justify-between px-4 pb-1">
        {/* user menu */}
        <Popover
          open={showUserMenu}
          onChange={open => setShowUserMenu(open)}
          content={
            <>
              {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                onClick={() => setShowUserMenu(false)}
                className={`flex flex-col text-[10px] text-slate-300/80 font-extralight whitespace-nowrap w-[8rem] bg-brand-darkBg/95  
                             border border-brand-darkBgAccent/30 shadow-sm rounded shadow-brand-darkBgAccent/30`}>
                <button
                  className="flex items-center pl-2.5 py-3 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/20"
                  onClick={() => {}}>
                  <PersonIcon className={`text-slate-400 mr-[5px] scale-[0.8]`} /> Account
                </button>
                <button
                  className="flex items-center pl-2.5 py-3 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/20"
                  onClick={() => {}}>
                  <MixerHorizontalIcon className={`text-slate-400 mr-[5px] scale-[0.8]`} /> Manage Plan
                </button>
              </div>
            </>
          }>
          {/* user */}
          <button className="cursor-pointer select-none " onClick={() => setShowUserMenu(true)}>
            <img src={manishProfilePicUrl} alt="user-profile" className="size-7  rounded-full opacity-90" />
          </button>
        </Popover>

        {/* app name */}
        <div className="select-none">
          <p className=" text-slate-500/70 text-[14px] tracking-wide text-center">Fresh Tabs</p>
        </div>

        {/* menu */}
        <Popover
          open={showMenu}
          onChange={open => setShowMenu(open)}
          content={
            <>
              {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
              <div
                onClick={() => setShowMenu(false)}
                className={`flex flex-col text-[10px] text-slate-300/80 font-extralight whitespace-nowrap w-[10rem] bg-brand-darkBg/95  
                             border border-brand-darkBgAccent/30 shadow-sm rounded shadow-brand-darkBgAccent/30`}>
                <button
                  className="flex items-center pl-2.5 py-3 hover:bg-brand-darkBgAccent/15 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/20"
                  onClick={() => setShowAnalytics(true)}>
                  <BarChartIcon className={`text-slate-600 mr-[5px] scale-[0.8]`} /> Analytics
                </button>
                <button
                  className="flex items-center pl-2.5 py-3 hover:bg-brand-darkBgAccent/20 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/20"
                  onClick={handleDiscardTabs}>
                  <MoonIcon className={`text-slate-600 mr-[5px] scale-[0.8]`} /> Discard Tabs
                </button>
                <button
                  className="flex items-center pl-2.5 py-3 hover:bg-brand-darkBgAccent/20 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/20"
                  onClick={handleSaveSpacesToBM}>
                  <BookmarkIcon className={`text-slate-600  mr-[5px] scale-[0.8]`} /> Save to Bookmark
                </button>
                <button
                  className="flex items-center pl-2.5 py-3 hover:bg-brand-darkBgAccent/20 transition-all duration-200 border-none outline-none focus-visible:bg-brand-darkBgAccent/20"
                  onClick={() => setShowSettingsModal(true)}>
                  <GearIcon className={`text-slate-600  mr-[5px] scale-[0.8]`} /> Preferences
                </button>
              </div>
            </>
          }>
          <button
            tabIndex={0}
            onClick={() => setShowMenu(true)}
            className={`text-slate-500/90 hover:bg-brand-darkBgAccent/20 rounded-full px-2 py-2 transition-all duration-200 focus:outline-brand-darkBgAccent  ${
              showMenu ? 'bg-brand-darkBgAccent/30' : ''
            }`}>
            <HamburgerMenuIcon className="scale-[1.1]" />
          </button>
        </Popover>
      </div>

      {/* modal */}
      <Analytics show={showAnalytics} onClose={() => setShowAnalytics(false)} />
    </>
  );
};

export default Header;
