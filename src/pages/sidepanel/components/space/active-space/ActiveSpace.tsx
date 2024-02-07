import { ISpace, ISpaceWithTabs, ITab, ITabWithIndex } from '@root/src/pages/types/global.types';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import MoreOptions from '../more-options';
import { deleteSpaceModalAtom, selectedTabsAtom, snackbarAtom, updateSpaceModalAtom } from '@root/src/stores/app';
import { SetStateAction, useAtom } from 'jotai';
import { removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { Dispatch, useState, useCallback, useEffect, MouseEventHandler } from 'react';
import { Tab } from '../tab';
import { motion } from 'framer-motion';
import { goToTab } from '@root/src/services/chrome-tabs/tabs';
import TabDraggedOutsideActiveSpace from './TabDraggedOutsideActiveSpace';
import { useKeyPressed } from '../../../hooks/useKeyPressed';
import { logger } from '@root/src/pages/utils/logger';

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

  // delete space modal  global state
  const [, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  //  key press
  const { isModifierKeyPressed, isShiftKeyPressed } = useKeyPressed({
    onDeletePressed: () => {
      (async () => await handleRemoveTabs())();
    },
    onEscapePressed: () => setSelectedTabs([]),
  });

  const isTabSelected = (id: number) => !!selectedTabs.find(t => t.id === id);

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

  const onTabDoubleClickHandler = async (id: number, index: number) => {
    // do nothing if ctl/cmd is pressed
    if (isModifierKeyPressed) return;
    await goToTab(id);

    setActiveSpace({ ...space, tabs, activeTabIndex: index });
  };

  const handleCreateNewTab = async (index: number) => {
    const { id } = await chrome.tabs.create({ url: 'chrome://newtab', active: true, index: ++index });
    setActiveSpace({
      ...space,
      tabs: [...tabs.toSpliced(index, 0, { id, title: 'New Tab', url: 'chrome://newtab' })],
      activeTabIndex: index,
    });
  };

  const onTabClick = (tab: ITabWithIndex) => {
    // clt/cmd is pressed
    if (isModifierKeyPressed) {
      // un-select if already selected
      if (isTabSelected(tab.id)) {
        setSelectedTabs(prev => [...prev.filter(t => t.id !== tab.id)]);
      } else {
        // select
        setSelectedTabs(prev => [...prev, tab]);
      }
    }

    // shift key was pressed (multi select)
    if (isShiftKeyPressed) {
      const lastSelectedTabIndex = !isNaN(Number(selectedTabs[selectedTabs.length - 1]?.index))
        ? selectedTabs[selectedTabs.length - 1]?.index
        : space.activeTabIndex;

      const tabIsBeforeLastSelectedTab = tab.index < lastSelectedTabIndex;

      const tabsInRange: ITabWithIndex[] = tabs
        .map((t, idx) => ({ ...t, index: idx }))
        .filter((_t, idx) => {
          //
          if (tabIsBeforeLastSelectedTab) {
            return idx <= lastSelectedTabIndex && idx >= tab.index;
          }
          return idx >= lastSelectedTabIndex && idx <= tab.index;
        });

      if (isTabSelected(tab.id)) {
        // unselect tabs
        setSelectedTabs(prev => [...prev.filter(t1 => !tabsInRange.find(t2 => t2.id === t1.id))]);
      } else {
        // select tabs
        setSelectedTabs(prev => [...prev, ...tabsInRange]);
      }
    }
  };

  // bounce div animation
  const bounceDivAnimation = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40, duration: 0.2 },
  };

  // mouse pos on drag start

  const [mouseXOnDrag, setMouseXOnDrag] = useState(0);

  const onTabClickMousePos: MouseEventHandler<HTMLDivElement> = ev => {
    console.log('🚀 ~ ActiveSpace ~ ev.clientX:', ev.clientX);
    setMouseXOnDrag(ev.clientX);
  };

  return space?.id ? (
    <div className="h-full mt-4 ">
      <div className="flex items-start h-[6.5%] justify-between px-2">
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
            onEditClick={() => setUpdateSpaceModal({ ...space, tabs })}
            onDeleteClick={() => setDeleteSpaceModal({ show: true, spaceId: space.id })}
          />
        </div>
      </div>

      {/* tabs */}
      <div
        id="active-space-scrollable-container"
        className="max-h-[90%] overflow-y-auto cc-scrollbar  overflow-x-hidden border-y pb-2 border-brand-darkBgAccent/30"
        style={{
          height: tabs.length * 1.9 + 'rem',
        }}>
        <Droppable droppableId={'active-space'} ignoreContainerClipping type="TAB">
          {(provided1, { isDraggingOver }) => (
            <div {...provided1.droppableProps} ref={provided1.innerRef} className="h-full py-1 w-full ">
              {/* render draggable  */}
              {tabs.map((tab, idx) => (
                <Draggable draggableId={'tab-' + tab.id} index={idx} key={tab.id}>
                  {(provided2, { isDragging }) => (
                    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                    <div
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      tabIndex={-1}
                      className={`relative outline-none mb-[2.5px] draggable-tab-container outline-none
                      ${isDraggingGlobal && isDragging && !isDraggingOver ? ` !w-[30px] ml-10` : 'w-fit'}
                      `}
                      style={{
                        ...provided2.draggableProps.style,
                        left: isDraggingGlobal && isDragging && !isDraggingOver ? `${mouseXOnDrag - 65}px` : '',
                      }}
                      onMouseDown={onTabClickMousePos}>
                      {isDraggingGlobal && isDragging && !isDraggingOver ? (
                        <TabDraggedOutsideActiveSpace numSelectedTabs={selectedTabs?.length} tabURL={tab.url} />
                      ) : (
                        <div className="relative w-[90vw]" tabIndex={-1}>
                          <Tab
                            tabData={tab}
                            isSpaceActive={true}
                            onCreateNewTab={() => handleCreateNewTab(idx)}
                            isModifierKeyPressed={isModifierKeyPressed || isShiftKeyPressed}
                            isTabActive={space.activeTabIndex === idx}
                            onTabDelete={() => handleRemoveTab(idx)}
                            onTabDoubleClick={() => onTabDoubleClickHandler(tab.id, idx)}
                            isSelected={isTabSelected(tab.id)}
                            onClick={() => onTabClick({ ...tab, index: idx })}
                          />
                          {/* tabs being dragged  */}

                          {/* dragging multiple tabs indicator */}
                          {isDraggingOver && isDragging && selectedTabs?.length > 0 ? (
                            <>
                              {/* number of tabs being dragged */}
                              {selectedTabs.length > 1 ? (
                                <span
                                  className={`w-6 h-6 rounded-lg px-1 py-1 absolute -top-2.5 -left-2.5 text-[11px] z-[200]
                            flex items-center justify-center font-semibold bg-brand-darkBgAccent text-slate-400`}>
                                  +{selectedTabs?.length - 1}
                                </span>
                              ) : null}
                              {/* tabs stacked effect  */}
                              {['one', 'two', 'three'].map((v, ix) => (
                                <div
                                  key={v}
                                  className="absolute  h-[1.7rem] w-[98%] -z-10 rounded-lg   border border-slate-700/70 bg-brand-darkBgAccent "
                                  style={{ top: `-${(ix + 0.25) * 2}px`, left: `-${(ix + 0.25) * 2}px` }}></div>
                              ))}
                            </>
                          ) : null}
                          {/* selected tabs not not dragged */}
                        </div>
                      )}
                      {/* active tab indicator */}
                      {space.activeTabIndex === idx ? (
                        <motion.div
                          {...bounceDivAnimation}
                          className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg bg-brand-darkBgAccent/70 z-10"></motion.div>
                      ) : null}
                      {/* selected tab indicator */}
                      {!isDraggingGlobal && isTabSelected(tab.id) ? (
                        <motion.div
                          {...bounceDivAnimation}
                          className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg border border-slate-700/60 bg-brand-darkBgAccent z-10 "
                          style={{ borderWidth: isDraggingGlobal && !isDragging ? '3px' : '1px' }}></motion.div>
                      ) : null}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  ) : null;
};

export default ActiveSpace;
