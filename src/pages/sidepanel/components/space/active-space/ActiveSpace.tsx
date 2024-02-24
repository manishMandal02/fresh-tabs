import { SetStateAction, useAtom } from 'jotai';
import { Dispatch, useState, useCallback, useEffect } from 'react';

import { ISnoozedTab, ISpace, ISpaceWithTabs, ITab } from '@root/src/pages/types/global.types';
import MoreOptions from '../more-options';
import { deleteSpaceModalAtom, selectedTabsAtom, snackbarAtom, updateSpaceModalAtom } from '@root/src/stores/app';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { useKeyPressed } from '../../../hooks/useKeyPressed';
import { logger } from '@root/src/pages/utils/logger';
import { getSnoozedTabs } from '@root/src/services/chrome-storage/snooze-tabs';
import SnoozedTabs from './SnoozedTabs';
import Tabs from '../../elements/tabs/Tabs';
import ActiveSpaceTabs from './ActiveSpaceTabs';
import SpaceHistory from './SpaceHistory';

type Props = {
  space: ISpace;
  tabs: ITab[];
  isDraggingGlobal: boolean;
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
};

const ActiveSpace = ({ space, tabs, setActiveSpace, isDraggingGlobal }: Props) => {
  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);
  // snackbar atom
  const [, setUpdateSpaceModal] = useAtom(updateSpaceModalAtom);

  // local state - show delete modal
  const [selectedTabs, setSelectedTabs] = useAtom(selectedTabsAtom);

  // snoozed tabs
  const [snoozedTabs, setSnoozedTabs] = useState<ISnoozedTab[]>([]);

  useEffect(() => {
    if (!space?.id) return;
    (async () => {
      const snoozedTabsStorage = await getSnoozedTabs(space.id);
      setSnoozedTabs(snoozedTabsStorage);
    })();
  }, [space]);

  // delete space modal  global state
  const [, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  //  key press
  useKeyPressed({
    monitorModifierKeys: false,
    onDeletePressed: () => {
      (async () => await handleRemoveTabs())();
    },
    onEscapePressed: () => setSelectedTabs([]),
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

  // remove multiple tabs
  const handleRemoveTabs = useCallback(async () => {
    // tab ids to remove
    const ids = selectedTabs.map(t => t.id);

    const updatedTabs = tabs.filter(tab => !ids.includes(tab.id));

    await setTabsForSpace(space.id, updatedTabs);

    const tabsToRemovePromise = [];

    // remove tabs from window
    for (const id of ids) {
      try {
        const tab = await chrome.tabs.get(id);
        if (!tab?.id) return;

        tabsToRemovePromise.push(chrome.tabs.remove(id));
      } catch (err) {
        logger.info(`Tab not found: ${err}`);
        continue;
      }
    }

    await Promise.allSettled(tabsToRemovePromise);

    setActiveSpace({ ...space, tabs: updatedTabs });
  }, [selectedTabs, setActiveSpace, tabs, space]);

  // if cmd/ctrl key is pressed save to state
  const handleKeydown = useCallback(
    ev => {
      const keyEv = ev as KeyboardEvent;

      if (keyEv.code.toLowerCase() === 'delete') {
        handleRemoveTabs();
      }

      if (keyEv.code.toLowerCase() === 'escape') {
        setSelectedTabs([]);
      }
    },
    [handleRemoveTabs, setSelectedTabs],
  );

  // keeping track of cmd/ctrl key press for UI action
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [handleKeydown]);

  return space?.id ? (
    <div className="h-full mt-4 ">
      <div className="flex items-center h-[6.5%] justify-between px-2">
        <div className="flex items-center ">
          <div className="text-lg  border-r  pr-5  w-fit select-none" style={{ borderColor: space.theme }}>
            {space.emoji}
          </div>
          <p className="text-base font-light text-slate-400 ml-2.5">{space.title}</p>
          {/* <p className="text-slate-500 text-[11px] px-2 py-[1.25px] bg-brand-darkBgAccent/30 rounded ml-1.5">
            {tabs.length}
          </p> */}
        </div>

        <div className="flex  justify-center select-none gap-x-2.5">
          {/* more options  */}
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onEditClick={() => setUpdateSpaceModal({ ...space, tabs })}
            onDeleteClick={() => setDeleteSpaceModal({ show: true, spaceId: space.id })}
          />
        </div>
      </div>

      {/* tabs */}
      <div
        id="active-space-scrollable-container"
        className="relative max-h-[90%]  cc-scrollbar min-h-fit overflow-x-hidden border-y pb-2 border-brand-darkBgAccent/30">
        <Tabs
          tabs={[`Active  (${tabs?.length || 0})`, `Snoozed (${snoozedTabs?.length || 0})`, 'History']}
          defaultTab={1}>
          <ActiveSpaceTabs tabs={tabs} isDraggingGlobal={isDraggingGlobal} />
          <SnoozedTabs tabs={snoozedTabs} />
          <SpaceHistory spaceId={space.id} />
        </Tabs>
      </div>
    </div>
  ) : null;
};

export default ActiveSpace;
