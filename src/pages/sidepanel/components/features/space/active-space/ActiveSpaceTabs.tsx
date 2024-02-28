import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import { MouseEventHandler, useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';

import { Tab } from '../tab';
import { logger } from '@root/src/pages/utils';
import { goToTab } from '@root/src/services/chrome-tabs/tabs';
import { useKeyPressed } from '../../../../hooks/useKeyPressed';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import TabDraggedOutsideActiveSpace from './TabDraggedOutsideActiveSpace';
import { ISpace, ITab, ITabWithIndex } from '@root/src/pages/types/global.types';
import { activeSpaceAtom, dragStateAtom, selectedTabsAtom } from '@root/src/stores/app';
import { removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';

type Props = {
  space: ISpace;
  tabs: ITab[];
};

export const TAB_HEIGHT = '32';

const ActiveSpaceTabs = ({ space, tabs }: Props) => {
  console.log('🚀 ~ ActiveSpaceTabs ~ 🔁 rendered');

  // global state
  // selected tabs
  const [selectedTabs, setSelectedTabs] = useAtom(selectedTabsAtom);
  // active space
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);
  // dragging state
  const [dragSate] = useAtom(dragStateAtom);

  // mouse pos on drag start
  const [mouseXOnDrag, setMouseXOnDrag] = useState(0);

  // used ref to store value as the useKeyPressed hook
  // didn't get the updated state in the callback
  const selectedTabsRef = useRef<ITabWithIndex[]>([]);

  useEffect(() => {
    selectedTabsRef.current = selectedTabs;
  }, [selectedTabs]);

  const onTabClickMousePos: MouseEventHandler<HTMLDivElement> = ev => {
    setMouseXOnDrag(ev.clientX);
  };

  // tabs dragging state
  const areTabsBeingDragged = useMemo(() => dragSate.isDragging && dragSate.type === 'tabs', [dragSate]);

  const handleGoToTab = useCallback(
    async (id: number, index: number) => {
      await goToTab(id);

      setSelectedTabs([]);

      setActiveSpace(prev => ({ ...prev, tabs, activeTabIndex: index }));
    },
    [setActiveSpace, tabs, setSelectedTabs],
  );

  // remove multiple tabs
  const handleRemoveTabs = useCallback(async () => {
    // tab ids to remove
    const ids = selectedTabsRef.current?.map(t => t.id);

    const updatedTabs = tabs?.filter(tab => !ids.includes(tab.id));

    await setTabsForSpace(space.id, updatedTabs);

    const tabsToRemovePromise = [];

    // remove tabs from window
    for (const id of ids) {
      try {
        tabsToRemovePromise.push(chrome.tabs.remove(id));
      } catch (err) {
        logger.info(`Tab not found: ${err}`);
        continue;
      }
    }

    await Promise.allSettled(tabsToRemovePromise);

    // get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    setActiveSpace({ ...space, activeTabIndex: tab.index, tabs: updatedTabs });
  }, [selectedTabsRef, setActiveSpace, tabs, space]);

  const { bounce } = useCustomAnimation();

  const { isModifierKeyPressed, isShiftKeyPressed } = useKeyPressed({
    monitorModifierKeys: true,
    onDeletePressed: () => {
      (async () => await handleRemoveTabs())();
    },
    onEscapePressed: () => {
      selectedTabsRef.current?.length > 0 && setSelectedTabs([]);
    },
  });

  const isTabSelected = (id: number) => !!selectedTabs.find(t => t.id === id);

  const onTabClick = async (tab: ITabWithIndex) => {
    console.log('🚀 ~ onTabClick ~ isModifierKeyPressed:', isModifierKeyPressed);
    console.log('🚀 ~ onTabClick ~ tab:', tab);

    // clt/cmd is pressed
    if (isModifierKeyPressed) {
      await handleGoToTab(tab.id, tab.index);
      return;
    }

    // shift key was pressed (multi select)
    if (isShiftKeyPressed) {
      const lastSelectedTabIndex = !Number.isNaN(Number(selectedTabs[selectedTabs.length - 1]?.index))
        ? selectedTabs[selectedTabs.length - 1]?.index
        : activeSpace.activeTabIndex;

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
      return;
    }

    // select tab
    if (!isTabSelected(tab.id)) {
      setSelectedTabs(prev => [...prev, tab]);
    } else {
      // un-select tab (already selected)
      setSelectedTabs(prev => [...prev.filter(t => t.id !== tab.id)]);
    }
  };

  const onTabDoubleClickHandler = async (id: number, index: number) => {
    // do nothing if ctl/cmd is pressed
    if (isModifierKeyPressed) return;
    await handleGoToTab(id, index);
  };

  const handleCreateNewTab = async (index: number) => {
    const { id } = await chrome.tabs.create({ url: 'chrome://newtab', active: true, index: ++index });
    setActiveSpace(prev => ({
      ...prev,
      tabs: [...tabs.toSpliced(index, 0, { id, title: 'New Tab', url: 'chrome://newtab' })],
      activeTabIndex: index,
    }));
  };
  console.log('🚀 ~ handleCreateNewTab ~ handleCreateNewTab:', handleCreateNewTab);

  // handle remove a single tab
  const handleRemoveTab = async (index: number) => {
    // remove tab
    await removeTabFromSpace(activeSpace, null, index, true);

    // update ui
    setActiveSpace(prev => ({ ...prev, tabs: [...tabs.filter((_t, idx) => idx !== index)] }));
  };

  return (
    <Droppable droppableId={'active-space'} ignoreContainerClipping type="TAB">
      {(provided1, { isDraggingOver }) => (
        <motion.div {...provided1.droppableProps} ref={provided1.innerRef} className="h-full w-full px-px">
          {/* render draggable  */}
          {tabs?.map((tab, idx) => (
            <Draggable draggableId={'tab-' + tab.id} index={idx} key={tab.id}>
              {(provided2, { isDragging }) => (
                // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                <div
                  ref={provided2.innerRef}
                  {...provided2.draggableProps}
                  {...provided2.dragHandleProps}
                  tabIndex={-1}
                  className={`relative outline-none mb-[4px]  focus-within:outline-none
                      ${areTabsBeingDragged && isDragging && !isDraggingOver ? ` !w-[30px] ml-10` : 'w-fit'}
                      `}
                  style={{
                    ...provided2.draggableProps.style,
                    left: areTabsBeingDragged && isDragging && !isDraggingOver ? `${mouseXOnDrag - 65}px` : '',
                  }}
                  onMouseDown={onTabClickMousePos}>
                  {areTabsBeingDragged && isDragging && !isDraggingOver ? (
                    // {/* tabs being dragged  */}
                    <TabDraggedOutsideActiveSpace numSelectedTabs={selectedTabs?.length} tabURL={tab.url} />
                  ) : (
                    <div
                      className={`relative w-[96vw] min-w-[96vw] bg-transparent`}
                      tabIndex={-1}
                      style={{
                        cursor: isModifierKeyPressed ? 'pointer' : 'default',
                      }}>
                      <Tab
                        tabData={tab}
                        isSpaceActive={true}
                        onTabDelete={() => handleRemoveTab(idx)}
                        onTabDoubleClick={() => onTabDoubleClickHandler(tab.id, idx)}
                        onClick={() => onTabClick({ ...tab, index: idx })}
                      />

                      {/* dragging multiple tabs indicator */}
                      {isDraggingOver && isDragging && selectedTabs?.length > 0 ? (
                        <>
                          {/* multiple tabs  */}
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
                              className="absolute   w-[98%] -z-10 rounded-lg   border border-slate-700/70 bg-brand-darkBgAccent "
                              style={{
                                height: TAB_HEIGHT + 'px',
                                top: `-${(ix + 0.25) * 2}px`,
                                left: `-${(ix + 0.25) * 2}px`,
                              }}></div>
                          ))}
                        </>
                      ) : null}
                    </div>
                  )}
                  {/* active tab indicator */}
                  {activeSpace.activeTabIndex === idx ? (
                    <motion.div
                      {...bounce}
                      style={{
                        height: TAB_HEIGHT + 'px',
                      }}
                      className="absolute  w-[99%] top-0 left-0 rounded-lg border border-brand-darkBgAccent/40 bg-brand-darkBgAccent/60 z-10"></motion.div>
                  ) : null}
                  {/* selected tab indicator */}
                  {!areTabsBeingDragged && isTabSelected(tab.id) ? (
                    <motion.div
                      {...bounce}
                      className="absolute  w-[99%] top-0 left-0 rounded-lg border border-slate-700/90 bg-brand-darkBgAccent/80 z-10 "
                      style={{
                        height: TAB_HEIGHT + 'px',

                        borderWidth: areTabsBeingDragged && !isDragging ? '3px' : '1px',
                      }}></motion.div>
                  ) : null}
                </div>
              )}
            </Draggable>
          ))}
        </motion.div>
      )}
    </Droppable>
  );
};

export default memo(ActiveSpaceTabs);
