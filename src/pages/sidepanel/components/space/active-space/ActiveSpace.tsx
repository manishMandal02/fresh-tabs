import { ISpace, ISpaceWithTabs, ITab, ITabWithIndex } from '@root/src/pages/types/global.types';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import MoreOptions from '../more-options';
import { selectedTabsAtom, snackbarAtom } from '@root/src/stores/app';
import { SetStateAction, useAtom } from 'jotai';
import { removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { Dispatch, useState, useCallback, useEffect } from 'react';
import { Tab } from '../tab';
import DeleteSpaceModal from '../delete/DeleteSpaceModal';
import { createPortal } from 'react-dom';
import UpdateSpace from '../update/UpdateSpace';
import { motion } from 'framer-motion';
import { goToTab } from '@root/src/services/chrome-tabs/tabs';

type Props = {
  space: ISpace;
  tabs: ITab[];
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
};

const ActiveSpace = ({ space, tabs, setActiveSpace }: Props) => {
  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);

  // local state - show delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // local state - show delete modal
  const [showEditModal, setShowEditModal] = useState(false);

  // local state - show delete modal
  const [selectedTabs, setSelectedTabs] = useAtom(selectedTabsAtom);

  // local state - ctrl/cmd key press status
  const [isModifierKeyPressed, setIsModifierKeyPressed] = useState(false);
  // local state - left shift key press status
  const [isShiftKeyPressed, setIsShiftKeyPressed] = useState(false);

  const isTabSelected = (id: number) => !!selectedTabs.find(t => t.id == id);

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

  // handle remove a single tab
  const handleRemoveTab = async (index: number) => {
    // remove tab
    await removeTabFromSpace(space, null, index, true);

    // update ui
    setActiveSpace({ ...space, tabs: [...tabs.filter((_t, idx) => idx !== index)] });
  };

  // remove multiple tabs
  const handleRemoveTabs = useCallback(async () => {
    const tabsToRemovePromise = [];

    // tab ids to remove
    const ids = selectedTabs.map(t => t.id);

    for (const id of ids) {
      tabsToRemovePromise.push(removeTabFromSpace(space, id, null, true));
    }

    await Promise.all(tabsToRemovePromise);

    setActiveSpace({ ...space, tabs: [...tabs.filter(t => !ids.includes(t.id))] });
  }, [selectedTabs, setActiveSpace, tabs, space]);

  // if cmd/ctrl key is pressed save to state
  const handleKeydown = useCallback(
    ev => {
      const keyEv = ev as KeyboardEvent;

      if (keyEv.ctrlKey || keyEv.metaKey) {
        setIsModifierKeyPressed(true);
      }

      if (keyEv.shiftKey) {
        setIsShiftKeyPressed(true);
      }

      if (keyEv.code.toLowerCase() === 'delete') {
        handleRemoveTabs();
      }

      if (keyEv.code.toLowerCase() === 'escape') {
        setSelectedTabs([]);
      }
    },
    [handleRemoveTabs, setSelectedTabs],
  );

  // keyup, reset the state
  const handleKeyUp = useCallback(() => {
    setIsModifierKeyPressed(false);
    setIsShiftKeyPressed(false);
  }, []);

  // keeping track of cmd/ctrl key press for UI action
  useEffect(() => {
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeydown, handleKeyUp]);

  const onTabDoubleClickHandler = async (id: number, index: number) => {
    // do nothing if ctl/cmd is pressed
    if (isModifierKeyPressed) return;
    await goToTab(id);

    setActiveSpace({ ...space, tabs, activeTabIndex: index });
  };

  const onTabClick = (tab: ITabWithIndex) => {
    if (isModifierKeyPressed) {
      // clt/cmd is pressed
      // un-select if already selected
      if (isTabSelected(tab.id)) return setSelectedTabs(prev => [...prev.filter(t => t.id !== tab.id)]);
      // select
      setSelectedTabs(prev => [...prev, tab]);
      return;
    }

    if (isShiftKeyPressed) {
      // shift key was pressed (multi select)
      const lastSelectedTabIndex = selectedTabs[selectedTabs.length - 1]?.index || space.activeTabIndex;

      const tabIsBeforeLastSelectedTab = tab.index < lastSelectedTabIndex;

      const tabsInRange: ITabWithIndex[] = tabs
        .map((t, idx) => ({ ...t, index: idx }))
        .filter((_t, idx) => {
          //
          if (tabIsBeforeLastSelectedTab) {
            return idx < lastSelectedTabIndex && idx >= tab.index;
          }
          return idx > lastSelectedTabIndex && idx <= tab.index;
        });

      setSelectedTabs(prev => [...prev, ...tabsInRange]);
    }
  };

  // active tab indicator/div animation
  const activeTabIndicatorAnimation = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40, duration: 0.2 },
  };

  return space?.id ? (
    <div className="h-full mt-4">
      {/* fav tabs */}

      <div className="flex items-start h-[6.5%] justify-between px-2  ">
        <div className="flex items-center ">
          <div className="text-lg  border-r  pr-5  w-fit select-none" style={{ borderColor: space.theme }}>
            {space.emoji}
          </div>
          <p className="text-base font-light text-slate-400 ml-2.5">{space.title}</p>
        </div>

        {/* more options menu */}
        <div className="flex items-center select-none">
          <span className="text-slate-500 mr-1 ">{tabs.length}</span>
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onEditClick={() => setShowEditModal(true)}
            onDeleteClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      {/* tabs */}
      <div className="h-[90%] overflow-y-auto cc-scrollbar overflow-x-hidden border-y border-brand-darkBgAccent/30">
        <Droppable droppableId={space.id}>
          {provided1 => (
            <div {...provided1.droppableProps} ref={provided1.innerRef} className="min-h-full py-1 ">
              {/* render draggable  */}
              {tabs.map((tab, idx) => (
                <Draggable draggableId={tab.id.toString()} index={idx} key={tab.id}>
                  {(provided2, { isDragging }) => (
                    <div
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      className="relative outline-none mb-[2.5px] ">
                      <div className="relative">
                        <Tab
                          tabData={tab}
                          isSpaceActive={true}
                          isModifierKeyPressed={isModifierKeyPressed || isShiftKeyPressed}
                          isTabActive={space.activeTabIndex === idx}
                          onTabDelete={() => handleRemoveTab(idx)}
                          onTabDoubleClick={() => onTabDoubleClickHandler(tab.id, idx)}
                          isSelected={isTabSelected(tab.id)}
                          onClick={() => onTabClick({ ...tab, index: idx })}
                        />
                        {/* dragging multiple tabs indicator */}
                        {isDragging && selectedTabs?.length > 0 ? (
                          <>
                            {/* number of tabs being dragged */}
                            <span
                              className={`w-6 h-6 rounded-lg px-1 py-1 absolute -top-2.5 -left-2.5 text-[11px] z-[200]
                            flex items-center justify-center font-semibold bg-brand-darkBgAccent text-slate-400`}>
                              +{selectedTabs?.length}
                            </span>

                            {/* tabs stacked effect  */}
                            {['one', 'two', 'three'].map((v, ix) => (
                              <div
                                key={v}
                                className="absolute  h-full w-[98%] -z-10 rounded-lg   border border-slate-700/70 bg-brand-darkBgAccent"
                                style={{ top: `-${(ix + 0.5) * 2}px`, left: `-${(ix + 1) * 2}px` }}></div>
                            ))}
                          </>
                        ) : null}
                      </div>
                      {/* active tab indicator */}
                      {space.activeTabIndex === idx ? (
                        <motion.div
                          {...activeTabIndicatorAnimation}
                          className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg bg-brand-darkBgAccent/70 z-10"></motion.div>
                      ) : null}
                      {/* selected tab indicator */}
                      {isTabSelected(tab.id) ? (
                        <motion.div
                          {...activeTabIndicatorAnimation}
                          className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg border border-slate-700/60 bg-brand-darkBgAccent z-10"></motion.div>
                      ) : null}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </div>
      {/* delete space alert modal */}
      {showDeleteModal &&
        createPortal(
          <DeleteSpaceModal spaceId={space.id} show={showDeleteModal} onClose={() => setShowDeleteModal(false)} />,
          document.body,
        )}
      {showEditModal &&
        createPortal(
          <UpdateSpace space={space} numTabs={tabs?.length} onClose={() => setShowEditModal(false)} />,
          document.body,
        )}
    </div>
  ) : null;
};

export default ActiveSpace;
