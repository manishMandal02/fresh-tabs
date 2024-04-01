import { SetStateAction, useAtom } from 'jotai';
import { Dispatch, useState, memo } from 'react';
import { BellIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { Notes } from '../../notes';
import SpaceTitle from './SpaceTitle';
import SnoozedTabs from './SnoozedTabs';
import MoreOptions from '../more-options';
import Tabs from '../../../../../../components/tabs/Tabs';
import ActiveSpaceTabs from './ActiveSpaceTabs';
import SpaceHistory from '../history/SpaceHistory';
import { useKeyShortcuts } from '../../../../hooks/useKeyShortcuts';
import { ISpaceWithTabs } from '@root/src/pages/types/global.types';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { deleteSpaceModalAtom, snackbarAtom } from '@root/src/stores/app';

type Props = {
  space: ISpaceWithTabs;
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
  onSearchClick: () => void;
  onNotificationClick: () => void;
};

const ActiveSpace = ({ space, setActiveSpace, onSearchClick, onNotificationClick }: Props) => {
  console.log('ActiveSpace ~ 🔁 rendered');

  // global state
  const [, setSnackbar] = useAtom(snackbarAtom);
  const [, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  // local state
  const [showSpaceHistory, setShowSpaceHistory] = useState(false);
  const [showSnoozedTabs, setShowSnoozedTabs] = useState(false);

  //  key press
  useKeyShortcuts({
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
        <SpaceTitle space={space} setActiveSpace={setActiveSpace} />

        <div className="flex item-center">
          {/* search */}
          <button
            tabIndex={0}
            onClick={onSearchClick}
            className={`text-slate-500/90 hover:bg-brand-darkBgAccent/30  px-1.5 py-1.5 rounded-full transition-all duration-200 outline-none focus:bg-brand-darkBgAccent/60`}>
            <MagnifyingGlassIcon className="scale-[1.1]" />
          </button>
          {/* Notification */}
          <button
            tabIndex={0}
            onClick={onNotificationClick}
            className={`text-slate-500/90 hover:bg-brand-darkBgAccent/30  px-1.5 py-1.5 rounded-full transition-all duration-200 outline-none focus:bg-brand-darkBgAccent/60`}>
            <BellIcon className="scale-[1.1]" />
          </button>
          {/* more options  */}
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onDeleteClick={() => setDeleteSpaceModal({ show: true, spaceId: space.id })}
            onHistoryClick={() => setShowSpaceHistory(true)}
            onSnoozedTabsClick={() => setShowSnoozedTabs(true)}
          />
        </div>
      </div>

      {/* tabs */}
      <div
        id="active-space-scrollable-container"
        className="relative max-h-[90%]  cc-scrollbar min-h-fit overflow-x-hidden border-b border-brand-darkBgAccent/20">
        <Tabs tabs={[`Tabs`, 'Notes']} defaultTab={1}>
          <ActiveSpaceTabs space={space} />
          <Notes space={space} />
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
