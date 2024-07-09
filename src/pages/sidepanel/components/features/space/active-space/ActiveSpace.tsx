import { useState, memo } from 'react';
import { useAtomValue, useSetAtom } from 'jotai';
import { BellIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { Notes } from '../../notes';
import SpaceTitle from './SpaceTitle';
import MoreOptions from '../more-options';
import ActiveSpaceTabs from './ActiveSpaceTabs';
import { cn, getUrlDomain } from '@root/src/utils';
import { ISpace } from '@root/src/types/global.types';
import Tabs from '../../../../../../components/tabs/Tabs';
import { syncTabs } from '@root/src/services/chrome-tabs/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import {
  activeSpaceGroupsAtom,
  activeSpaceTabsAtom,
  appSettingsAtom,
  deleteSpaceModalAtom,
  selectedTabsAtom,
  showSnoozedTabsModalAtom,
  showSpaceHistoryModalAtom,
  snackbarAtom,
  updateSpaceAtom,
  userNotificationsAtom,
} from '@root/src/stores/app';

type Props = {
  space: ISpace;
  onSearchClick: () => void;
  onNotificationClick: () => void;
};

const ActiveSpace = ({ space, onSearchClick, onNotificationClick }: Props) => {
  console.log('ActiveSpace ~ 🔁 rendered');

  // global state
  const appSettings = useAtomValue(appSettingsAtom);
  const userNotifications = useAtomValue(userNotificationsAtom);
  const setSnackbar = useSetAtom(snackbarAtom);
  const setDeleteSpaceModal = useSetAtom(deleteSpaceModalAtom);
  const setShowSpaceHistoryModal = useSetAtom(showSpaceHistoryModalAtom);
  const setShowSnoozedTabsModal = useSetAtom(showSnoozedTabsModalAtom);

  const updateSpaceState = useSetAtom(updateSpaceAtom);
  const setActSpaceTabs = useSetAtom(activeSpaceTabsAtom);
  const setActSpaceGroups = useSetAtom(activeSpaceGroupsAtom);
  const setSelectedTabs = useSetAtom(selectedTabsAtom);

  // local state
  const [selectedNavTab, setSelectedNavTab] = useState(1);
  const [notesSearchQuery, setNotesSearchQuery] = useState('');

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

  // show site notes
  const handleTabNotesClick = (url: string) => {
    const domain = getUrlDomain(url);
    setNotesSearchQuery(`site:${domain}`);
    setSelectedNavTab(2);
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
            className={`text-slate-500/90 relative hover:bg-brand-darkBgAccent/30  px-1.5 py-1.5 rounded-full transition-all duration-200 outline-none focus:bg-brand-darkBgAccent/60`}>
            <BellIcon className="scale-[1.1]" />
            <span
              className={cn(
                'absolute -top-[1px] -right-[0.75px] text-[8.5px] text-slate-300/80 font-semibold px-[3.5px] py-[0.5px] bg-brand-darkBgAccent/70 rounded-full ',
                { 'bg-brand-primary/90 text-slate-800': userNotifications?.length > 0 },
              )}>
              {userNotifications?.length || 0}
            </span>
          </button>
          {/* more options  */}
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onDeleteClick={() => setDeleteSpaceModal({ show: true, spaceId: space.id })}
            onHistoryClick={() => setShowSpaceHistoryModal(true)}
            onSnoozedTabsClick={() => setShowSnoozedTabsModal(true)}
          />
        </div>
      </div>

      {/* tabs */}
      <div
        id="active-space-scrollable-container"
        className="relative max-h-[90%]  cc-scrollbar min-h-fit overflow-x-hidden overflow-y-auto border-b border-brand-darkBgAccent/20 pb-1">
        {!appSettings?.notes.isDisabled ? (
          <Tabs
            tabs={[`Tabs`, 'Notes']}
            defaultTab={selectedNavTab}
            selectedTab={selectedNavTab}
            onTabChange={tab => setSelectedNavTab(tab)}>
            <ActiveSpaceTabs space={space} onTabNotesClick={handleTabNotesClick} />
            <Notes space={space} notesSearchQuery={notesSearchQuery} />
          </Tabs>
        ) : (
          <ActiveSpaceTabs space={space} onTabNotesClick={handleTabNotesClick} />
        )}
      </div>
    </div>
  ) : null;
};

export default memo(ActiveSpace);
