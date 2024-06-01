import { useState, memo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { BellIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { Notes } from '../../notes';
import SpaceTitle from './SpaceTitle';
import SnoozedTabs from './SnoozedTabs';
import MoreOptions from '../more-options';
import ActiveSpaceTabs from './ActiveSpaceTabs';
import SpaceHistory from '../history/SpaceHistory';
import Tabs from '../../../../../../components/tabs/Tabs';
import { ISpace } from '@root/src/types/global.types';
import { syncTabs } from '@root/src/services/chrome-tabs/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import {
  activeSpaceGroupsAtom,
  activeSpaceTabsAtom,
  deleteSpaceModalAtom,
  selectedTabsAtom,
  snackbarAtom,
  updateSpaceAtom,
} from '@root/src/stores/app';

type Props = {
  space: ISpace;
  onSearchClick: () => void;
  onNotificationClick: () => void;
};

const ActiveSpace = ({ space, onSearchClick, onNotificationClick }: Props) => {
  console.log('ActiveSpace ~ 🔁 rendered');

  // global state
  const [, setSnackbar] = useAtom(snackbarAtom);
  const [, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  const updateSpaceState = useSetAtom(updateSpaceAtom);
  const setActSpaceTabs = useSetAtom(activeSpaceTabsAtom);
  const setActSpaceGroups = useSetAtom(activeSpaceGroupsAtom);
  const setSelectedTabs = useSetAtom(selectedTabsAtom);

  // local state
  const [showSpaceHistory, setShowSpaceHistory] = useState(false);
  const [showSnoozedTabs, setShowSnoozedTabs] = useState(false);

  // sync tabs
  const handleSyncTabs = async () => {
    setSnackbar({ msg: '', show: false, isLoading: true });

    const { tabs, groups, activeTab } = await syncTabs(space.id, space.windowId, space.activeTabIndex);

    // update space's active tab index if not correct
    if (space.activeTabIndex !== activeTab.index) {
      await updateSpace(space.id, { ...space, activeTabIndex: activeTab.index });
      updateSpaceState({ ...space, activeTabIndex: activeTab.index });
    }

    // update ui state
    setActSpaceGroups(groups);
    setActSpaceTabs(tabs);
    setSelectedTabs([]);

    setSnackbar({ msg: 'Tabs synced', show: true, isLoading: false, isSuccess: true });
  };

  return space?.id ? (
    <div className="h-full mt-4 ">
      <div className="flex items-center h-[6.5%] justify-between px-1">
        <SpaceTitle space={space} />

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
        className="relative max-h-[90%]  cc-scrollbar min-h-fit overflow-x-hidden border-b border-brand-darkBgAccent/20 pb-1">
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
