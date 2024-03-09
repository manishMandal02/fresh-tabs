import { SetStateAction, useAtom } from 'jotai';
import { Dispatch, useState, memo } from 'react';
import { BellIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

import SnoozedTabs from './SnoozedTabs';
import MoreOptions from '../more-options';
import Tabs from '../../../elements/tabs/Tabs';
import ActiveSpaceTabs from './ActiveSpaceTabs';
import Popover from '../../../elements/popover';
import SpaceHistory from '../history/SpaceHistory';
import { useKeyPressed } from '../../../../hooks/useKeyPressed';
import { ISpaceWithTabs } from '@root/src/pages/types/global.types';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { deleteSpaceModalAtom, snackbarAtom, updateSpaceModalAtom } from '@root/src/stores/app';

type Props = {
  space: ISpaceWithTabs;
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
  onSearchClick: () => void;
};

const ActiveSpace = ({ space, setActiveSpace, onSearchClick }: Props) => {
  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);
  // snackbar atom
  const [, setUpdateSpaceModal] = useAtom(updateSpaceModalAtom);

  // show history & snoozed tabs for space
  const [showSpaceHistory, setShowSpaceHistory] = useState(false);
  const [showSnoozedTabs, setShowSnoozedTabs] = useState(false);
  // show user menu
  const [showNotifications, setShowNotifications] = useState(false);

  // delete space modal  global state
  const [, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  //  key press
  useKeyPressed({
    monitorModifierKeys: false,
  });

  // sync tabs
  const handleSyncTabs = async () => {
    setSnackbar({ msg: '', show: false, isLoading: true });

    // get all tabs in the window
    const currentTabs = await chrome.tabs.query({ currentWindow: true });

    const tabsInWindow = currentTabs.map(t => ({ title: t.title, url: t.url, id: t.id }));

    const activeTab = currentTabs.find(t => t.active);

    // update space's active tab index if not correct
    if (space.activeTabIndex !== activeTab.index) {
      await updateSpace(space.id, { ...space, activeTabIndex: activeTab.index });
    }
    // update tabs in space
    await setTabsForSpace(space.id, tabsInWindow);

    setActiveSpace({ ...space, activeTabIndex: activeTab.index, tabs: [...tabsInWindow] });

    setSnackbar({ msg: '', show: false, isLoading: false });

    setSnackbar({ msg: 'Tabs synced', show: true, isLoading: false, isSuccess: true });
  };

  return space?.id ? (
    <div className="h-full mt-4 ">
      <div className="flex items-center h-[6.5%] justify-between px-1">
        <div className="flex items-center ">
          <div className="text-lg  border-r  pr-3  w-fit select-none" style={{ borderColor: space.theme }}>
            {space.emoji}
          </div>
          <p className="text-base font-light text-slate-400 ml-2.5">{space.title}</p>
          {/* <p className="text-slate-500 text-[11px] px-2 py-[1.25px] bg-brand-darkBgAccent/30 rounded ml-1.5">
            {tabs.length}
          </p> */}
        </div>

        <div className="flex  items-center  select-none gap-x-1">
          <button
            tabIndex={0}
            onClick={onSearchClick}
            className={`text-slate-500/90 hover:bg-brand-darkBgAccent/20 rounded-full px-2 py-2 transition-all duration-200 outline-none focus:bg-brand-darkBgAccent/60`}>
            <MagnifyingGlassIcon className="scale-[1.1]" />
          </button>
          {/* Notification */}
          <Popover
            open={showNotifications}
            onChange={open => setShowNotifications(open)}
            content={
              <div
                className={`flex flex-col items-center  text-[10px] text-slate-400/80 w-[14rem] min-h-[10rem]  py-2 px-2
                              bg-brand-darkBg/95  border border-brand-darkBgAccent/40 shadow-sm rounded shadow-brand-darkBgAccent/50`}>
                <div className="">
                  <span className="text-center my-auto text-[12px]">No new notifications</span>
                </div>
              </div>
            }>
            <button
              tabIndex={0}
              onClick={() => setShowNotifications(true)}
              className={`text-slate-500/90 hover:bg-brand-darkBgAccent/20 rounded-full px-2 py-2 transition-all duration-200 outline-none focus:bg-brand-darkBgAccent/60  ${
                showNotifications ? 'bg-brand-darkBgAccent/30' : ''
              }`}>
              <BellIcon className="scale-[1.1]" />
            </button>
          </Popover>
          {/* more options  */}
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onEditClick={() => setUpdateSpaceModal({ ...space, tabs: space.tabs })}
            onDeleteClick={() => setDeleteSpaceModal({ show: true, spaceId: space.id })}
            onHistoryClick={() => setShowSpaceHistory(true)}
            onSnoozedTabsClick={() => setShowSnoozedTabs(true)}
          />
        </div>
      </div>

      {/* tabs */}
      <div
        id="active-space-scrollable-container"
        className="relative max-h-[90%]  cc-scrollbar min-h-fit overflow-x-hidden border-b border-brand-darkBgAccent/50">
        <Tabs tabs={[`Tabs`, 'Notes']} defaultTab={1}>
          <ActiveSpaceTabs space={space} />
          <div className="text-center text-slate-500 py-12">Notes</div>
        </Tabs>
      </div>

      {/* space history modal */}
      <SpaceHistory show={showSpaceHistory} onClose={() => setShowSpaceHistory(false)} />
      {/* snoozed tabs modal */}
      <SnoozedTabs show={showSnoozedTabs} onClose={() => setShowSnoozedTabs(false)} />
    </div>
  ) : null;
};

export default memo(ActiveSpace);
