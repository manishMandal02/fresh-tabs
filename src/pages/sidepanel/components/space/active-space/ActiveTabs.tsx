import { useState, MouseEventHandler } from 'react';
import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Droppable, Draggable } from 'react-beautiful-dnd';

import { Tab } from '../tab';
import { useKeyPressed } from '../../../hooks/useKeyPressed';
import { useCustomAnimation } from '../../../hooks/useAnimation';
import { activeSpaceAtom, selectedTabsAtom } from '@root/src/stores/app';
import { ITab, ITabWithIndex } from '@root/src/pages/types/global.types';
import TabDraggedOutsideActiveSpace from './TabDraggedOutsideActiveSpace';
import { removeTabFromSpace } from '@root/src/services/chrome-storage/tabs';
import { goToTab } from '@root/src/services/chrome-tabs/tabs';

type Props = {
  tabs: ITab[];
  isDraggingGlobal: boolean;
};

const ActiveTabs = ({ tabs, isDraggingGlobal }: Props) => {
  const [selectedTabs, setSelectedTabs] = useAtom(selectedTabsAtom);

  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);

  // mouse pos on drag start
  const [mouseXOnDrag, setMouseXOnDrag] = useState(0);

  const onTabClickMousePos: MouseEventHandler<HTMLDivElement> = ev => {
    setMouseXOnDrag(ev.clientX);
  };

  const { bounce } = useCustomAnimation();

  const { isModifierKeyPressed, isShiftKeyPressed } = useKeyPressed({ monitorModifierKeys: true });

  const isTabSelected = (id: number) => !!selectedTabs.find(t => t.id === id);

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
    }
  };

  const onTabDoubleClickHandler = async (id: number, index: number) => {
    // do nothing if ctl/cmd is pressed
    if (isModifierKeyPressed) return;
    await goToTab(id);

    setActiveSpace(prev => ({ ...prev, tabs, activeTabIndex: index }));
  };

  const handleCreateNewTab = async (index: number) => {
    const { id } = await chrome.tabs.create({ url: 'chrome://newtab', active: true, index: ++index });
    setActiveSpace(prev => ({
      ...prev,
      tabs: [...tabs.toSpliced(index, 0, { id, title: 'New Tab', url: 'chrome://newtab' })],
      activeTabIndex: index,
    }));
  };

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
        <motion.div {...provided1.droppableProps} ref={provided1.innerRef} {...bounce} className="h-full w-full ">
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
                  className={`relative outline-none mb-[2.5px]  
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
                        isModifierKeyPressed={isModifierKeyPressed}
                        isTabActive={activeSpace.activeTabIndex === idx}
                        onTabDelete={() => handleRemoveTab(idx)}
                        onTabDoubleClick={() => onTabDoubleClickHandler(tab.id, idx)}
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
                  {activeSpace.activeTabIndex === idx ? (
                    <motion.div
                      {...bounce}
                      className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg bg-brand-darkBgAccent/70 z-10"></motion.div>
                  ) : null}
                  {/* selected tab indicator */}
                  {!isDraggingGlobal && isTabSelected(tab.id) ? (
                    <motion.div
                      {...bounce}
                      className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg border border-slate-700/60 bg-brand-darkBgAccent z-10 "
                      style={{ borderWidth: isDraggingGlobal && !isDragging ? '3px' : '1px' }}></motion.div>
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

export default ActiveTabs;
