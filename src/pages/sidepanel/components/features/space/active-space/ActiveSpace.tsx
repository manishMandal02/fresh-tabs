import { SetStateAction, useAtom } from 'jotai';
import { Dispatch, useState, memo } from 'react';

import SnoozedTabs from './SnoozedTabs';
import SpaceHistory from '../history/SpaceHistory';
import MoreOptions from '../more-options';
import Tabs from '../../../elements/tabs/Tabs';
import ActiveSpaceTabs from './ActiveSpaceTabs';
import { useKeyPressed } from '../../../../hooks/useKeyPressed';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { ISpace, ISpaceWithTabs, ITab } from '@root/src/pages/types/global.types';
import { deleteSpaceModalAtom, snackbarAtom, updateSpaceModalAtom } from '@root/src/stores/app';

type Props = {
  space: ISpace;
  tabs: ITab[];
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
};

const ActiveSpace = ({ space, tabs, setActiveSpace }: Props) => {
  console.log('🚀 ~ ActiveSpace ~ 🔁 rendered');

  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);
  // snackbar atom
  const [, setUpdateSpaceModal] = useAtom(updateSpaceModalAtom);

  // show history & snoozed tabs for space
  const [showSpaceHistory, setShowSpaceHistory] = useState(false);
  const [showSnoozedTabs, setShowSnoozedTabs] = useState(false);

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
      <div className="flex items-center h-[6.5%] justify-between px-1.5">
        <div className="flex items-center ">
          <div className="text-lg  border-r  pr-3  w-fit select-none" style={{ borderColor: space.theme }}>
            {space.emoji}
          </div>
          <p className="text-base font-light text-slate-400 ml-2.5">{space.title}</p>
          {/* <p className="text-slate-500 text-[11px] px-2 py-[1.25px] bg-brand-darkBgAccent/30 rounded ml-1.5">
            {tabs.length}
          </p> */}
        </div>

        <div className="flex  items-center  select-none ">
          {/* more options  */}
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onEditClick={() => setUpdateSpaceModal({ ...space, tabs })}
            onDeleteClick={() => setDeleteSpaceModal({ show: true, spaceId: space.id })}
            onHistoryClick={() => setShowSpaceHistory(true)}
            onSnoozedTabsClick={() => setShowSnoozedTabs(true)}
          />
        </div>
      </div>

      {/* tabs */}
      <div
        id="active-space-scrollable-container"
        className="relative max-h-[90%]  cc-scrollbar min-h-fit overflow-x-hidden border-y pb-2 border-brand-darkBgAccent/30">
        <Tabs tabs={[`Tabs`, 'Notes']} defaultTab={1}>
          <ActiveSpaceTabs space={space} tabs={tabs} />
          <div className="text-center text-slate-500 py-12">Notes</div>
        </Tabs>
      </div>

      {/* space history modal */}
      <SpaceHistory show={showSpaceHistory} spaceId={space.id} onClose={() => setShowSpaceHistory(false)} />
      {/* snoozed tabs modal */}
      <SnoozedTabs show={showSnoozedTabs} spaceId={space.id} onClose={() => setShowSnoozedTabs(false)} />
    </div>
  ) : null;
};

export default memo(ActiveSpace);
