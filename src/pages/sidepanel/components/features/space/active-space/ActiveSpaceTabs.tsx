import 'react-complex-tree/lib/style-modern.css';

import { motion } from 'framer-motion';

import { useHotkeys } from 'react-hotkeys-hook';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { Draggable } from 'react-beautiful-dnd';
import { UncontrolledTreeEnvironment, Tree, StaticTreeDataProvider } from 'react-complex-tree';
import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';

import { Tab } from '../tab';
import { logger } from '@root/src/utils';
import TabContextMenu from './TabContextMenu';
import { goToTab } from '@root/src/services/chrome-tabs/tabs';
import { useCustomAnimation } from '../../../../hooks/useCustomAnimation';
import { useMetaKeyPressed } from '@root/src/pages/sidepanel/hooks/use-key-shortcuts';
import { IGroup, IMessageEventSidePanel, ISpace, ITab } from '@root/src/types/global.types';
import { removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import {
  activeSpaceAtom,
  activeSpaceGroupsAtom,
  activeSpaceTabsAtom,
  dragStateAtom,
  selectedTabsAtom,
  updateSpaceAtom,
} from '@root/src/stores/app';

interface IGroupedTabs {
  index: number | string;
  canMove: boolean;
  isFolder?: boolean;
  canRename?: boolean;
  children: number[];
  data: IGroup | ITab | string;
}

const mapTabToGroups = (tabs: ITab[], groups: IGroup[]) => {
  const groupedTabs: Record<number | string, IGroupedTabs> = {
    root: {
      index: 'root',
      isFolder: false,
      canMove: false,
      children: [],
      data: 'Root Item',
    },
  };

  // map data
  tabs.forEach(item => {
    const tabItem = {
      index: item.id,
      canMove: true,
      children: [],
      data: item,
    };

    groupedTabs[item.id] = tabItem;

    groupedTabs['root'].children.push(item.id);

    if (item?.groupId < 1) return;

    const group = groups.find(g => g.id === item?.groupId);

    if (!group?.id) {
      return;
    }

    if (groupedTabs[group.id]?.index) {
      // add tab to existing group
      groupedTabs[group.id].children.push(item.id);
    } else {
      // add group item
      const groupItem = {
        index: group.id,
        canMove: true,
        canRename: false,
        isFolder: true,
        children: [item.id],
        data: group,
      };

      groupedTabs[group.id] = groupItem;
      groupedTabs['root'].children.push(group.id);
    }
  });

  return groupedTabs;
};

const getDiscardedTabsInWindow = async (windowId: number) => {
  const tabs = await chrome.tabs.query({ windowId, discarded: true });

  return tabs.length > 0 ? tabs.map(tab => tab.id) : [];
};

type Props = {
  space: ISpace;
};

export const TAB_HEIGHT = 32;

const ActiveSpaceTabs = ({ space }: Props) => {
  console.log('ActiveSpaceTabs ~ 🔁 rendered');

  // global state
  // selected tabs
  const [selectedTabs, setSelectedTabs] = useAtom(selectedTabsAtom);
  // active space
  const activeSpace = useAtomValue(activeSpaceAtom);
  const updateSpaceState = useSetAtom(updateSpaceAtom);
  const [activeSpaceTabs, setActiveSpaceTabs] = useAtom(activeSpaceTabsAtom);
  const [activeSpaceGroups, setActiveSpaceGroups] = useAtom(activeSpaceGroupsAtom);

  console.log('🚀 ~ ActiveSpaceTabs ~ setActiveSpaceGroups:', setActiveSpaceGroups);

  const groupedTabs = useMemo(() => {
    return mapTabToGroups(activeSpaceTabs, activeSpaceGroups);
  }, [activeSpaceTabs, activeSpaceGroups]);

  console.log('🚀 ~ groupedTabs ~ groupedTabs:', groupedTabs);
  // dragging state
  const [dragSate] = useAtom(dragStateAtom);

  // local state
  const [discardedTabIDs, setDiscardedTabIDs] = useState<number[]>([]);

  // used ref to store the value to access in a hook outside
  // that didn't get the updated state in the callback
  const selectedTabsRef = useRef<ITab[]>([]);

  // update ui state if tabs discarded in background
  chrome.runtime.onMessage.addListener(async (message, _sender, response) => {
    const msg = message as IMessageEventSidePanel;

    if (msg.event === 'TABS_DISCARDED' && msg.payload?.spaceId === space.id) {
      const tabs = await getDiscardedTabsInWindow(space.windowId);
      setDiscardedTabIDs(tabs);
      response(true);
    }
  });

  // get discarded tabs when component renders
  useEffect(() => {
    (async () => {
      const tabs = await getDiscardedTabsInWindow(space.windowId);
      setDiscardedTabIDs(tabs);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    selectedTabsRef.current = selectedTabs;
  }, [selectedTabs]);

  // tabs dragging state
  const areTabsBeingDragged = useMemo(() => dragSate.isDragging && dragSate.type === 'tabs', [dragSate]);

  console.log('✅ ~ ActiveSpaceTabs ~ areTabsBeingDragged:', areTabsBeingDragged);

  const handleGoToTab = useCallback(
    async (id: number, index: number) => {
      await goToTab(id);

      setSelectedTabs([]);

      updateSpaceState({ ...space, activeTabIndex: index });
    },
    [space, setSelectedTabs, updateSpaceState],
  );

  // remove multiple tabs
  const handleRemoveTabs = useCallback(async () => {
    // tab ids to remove
    const ids = selectedTabsRef.current?.map(t => t.id);

    const updatedTabs = activeSpaceTabs?.filter(t => !ids.includes(t.id));

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

    setActiveSpaceTabs(updatedTabs);
    updateSpaceState({ ...space, activeTabIndex: tab.index });
  }, [selectedTabsRef, space, activeSpaceTabs, updateSpaceState, setActiveSpaceTabs]);

  const { bounce } = useCustomAnimation();

  // on escape key presses
  useHotkeys(
    'escape',
    () => {
      selectedTabsRef.current?.length > 0 && setSelectedTabs([]);
    },
    [],
  );

  // on delete key presses
  useHotkeys(
    'delete',
    () => {
      (async () => await handleRemoveTabs())();
    },
    [],
  );

  const { isShiftKeyPressed, isMetaKeyPressed } = useMetaKeyPressed({});

  const isTabSelected = useCallback((id: number) => selectedTabs.some(t => t.id === id), [selectedTabs]);

  const isTabDiscarded = useCallback((id: number) => discardedTabIDs.some(tabId => tabId === id), [discardedTabIDs]);

  const onTabClick = useCallback(
    async (tab: ITab) => {
      // ctrl/cmd is pressed
      if (isMetaKeyPressed) {
        await handleGoToTab(tab.id, tab.index);
        return;
      }

      // shift key was pressed (multi select)
      if (isShiftKeyPressed) {
        const lastSelectedTabIndex = !Number.isNaN(Number(selectedTabs[selectedTabs.length - 1]?.index))
          ? selectedTabs[selectedTabs.length - 1]?.index
          : activeSpace.activeTabIndex;

        const tabIsBeforeLastSelectedTab = tab.index < lastSelectedTabIndex;

        const tabsInRange: ITab[] = activeSpaceTabs
          .map((t, idx) => ({ ...t, index: idx }))
          .filter((t, idx) => {
            // duplicate tab
            if (selectedTabs.some(sT => sT.id === t.id)) return false;

            // select range above or below last selected tab
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
    },
    [
      activeSpace.activeTabIndex,
      isMetaKeyPressed,
      isShiftKeyPressed,
      handleGoToTab,
      isTabSelected,
      selectedTabs,
      setSelectedTabs,
      activeSpaceTabs,
    ],
  );

  const onTabDoubleClickHandler = async (id: number, index: number) => {
    // do nothing if ctl/cmd is pressed
    if (isMetaKeyPressed) return;
    await handleGoToTab(id, index);
  };

  // handle remove a single tab
  const handleRemoveTab = async (index: number) => {
    // remove tab
    await removeTabFromSpace(activeSpace, null, index, true);

    // update ui
    setActiveSpaceTabs(prev => [...prev.filter((_t, idx) => idx !== index)]);
  };

  // returns a single tab to render
  const ActiveSpaceSingleTab = (tab: ITab, idx: number, isDraggingOver: boolean) => (
    <Draggable draggableId={'tab-' + tab.id} index={idx} key={tab.id}>
      {(provided2, { isDragging }) => (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          ref={provided2.innerRef}
          {...provided2.draggableProps}
          {...provided2.dragHandleProps}
          tabIndex={-1}
          className={'relative outline-none mb-[4px]  focus-within:outline-none w-fit'}>
          <>
            <TabContextMenu
              tab={tab}
              allTabs={activeSpaceTabs}
              setActiveSpaceTabs={setActiveSpaceTabs}
              space={space}
              selectedTabs={selectedTabs}
              onRemoveClick={async () => {
                if (selectedTabs?.length > 1) {
                  await handleRemoveTab(tab.id);
                } else {
                  await handleRemoveTabs();
                }
              }}>
              {/* tab */}
              <div
                className={`relative w-[96vw] min-w-[96vw] bg-transparent`}
                tabIndex={-1}
                style={{
                  cursor: isMetaKeyPressed ? 'pointer' : 'default',
                }}>
                <Tab
                  tabData={tab}
                  isTabDiscarded={isTabDiscarded(tab.id)}
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
            </TabContextMenu>

            {/* active tab indicator */}
            {activeSpace.activeTabIndex === idx ? (
              <motion.div
                {...bounce}
                style={{
                  height: TAB_HEIGHT + 'px',
                }}
                className="absolute  w-[99%] top-0 left-0 rounded-lg border  border-slate-700/60 bg-brand-darkBgAccent/60 z-10 pointer-events-none"></motion.div>
            ) : null}

            {/* selected tab indicator */}
            {isTabSelected(tab.id) ? (
              <motion.div
                {...bounce}
                className={`absolute w-[99%] top-0 left-0 rounded-lg border border-gray-500/90 bg-brand-darkBgAccent/80 z-10 pointer-events-none`}
                style={{
                  height: TAB_HEIGHT + 'px',
                  borderWidth: areTabsBeingDragged && !isDragging ? '3px' : '1px',
                }}></motion.div>
            ) : null}

            {areTabsBeingDragged && isTabSelected(tab.id) && !isDragging ? (
              <div
                style={{
                  height: TAB_HEIGHT + 'px',
                }}
                className={`absolute w-[99%] top-0 left-0 rounded-lg border border-brand-darkBgAccent/40 bg-brand-darkBgAccent/40 z-[99]`}></div>
            ) : null}
          </>
        </div>
      )}
    </Draggable>
  );

  console.log('🚀 ~ ActiveSpaceTabs ~ ActiveSpaceSingleTab:', ActiveSpaceSingleTab);

  return (
    <div className="text-slate-400">
      <UncontrolledTreeEnvironment
        canDragAndDrop={true}
        canDropOnFolder={true}
        canReorderItems={true}
        dataProvider={
          new StaticTreeDataProvider(groupedTabs, (item, data) => ({
            ...item,
            data,
          }))
        }
        getItemTitle={item => (item.data?.name ? item.data.name : item.data.title)}
        viewState={{}}
        renderItemTitle={({ title }) => <span>{title}</span>}
        renderItemArrow={({ item, context }) =>
          item.isFolder ? <span {...context.arrowProps}>{context.isExpanded ? 'v ' : '> '}</span> : null
        }
        renderItem={({ title, arrow, context, children }) => (
          <li {...context.itemContainerWithChildrenProps} className="items-start m-0 flex flex-col">
            {/* @ts-expect-error - lib code */}
            <button {...context.itemContainerWithoutChildrenProps} {...context.interactiveElementProps} className="">
              {arrow}
              {title}
            </button>
            {children}
          </li>
        )}
        renderTreeContainer={({ children, containerProps }) => <div {...containerProps}>{children}</div>}
        renderItemsContainer={({ children, containerProps }) => <ul {...containerProps}>{children}</ul>}>
        <Tree treeId="active-space" rootItem="root" treeLabel="Tree Example" />
      </UncontrolledTreeEnvironment>
    </div>
  );
};

export default memo(ActiveSpaceTabs);
