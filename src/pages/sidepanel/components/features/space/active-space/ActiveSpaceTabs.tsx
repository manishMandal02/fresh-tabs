// lib styles
import 'react-complex-tree/lib/style-modern.css';

import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { Draggable } from 'react-beautiful-dnd';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react';
import { Tree, ControlledTreeEnvironment, type TreeRef } from 'react-complex-tree';
import { CopyIcon, Cross1Icon, ChevronDownIcon, ExternalLinkIcon } from '@radix-ui/react-icons';

import { Tab } from '../tab';
import { copyToClipboard, logger } from '@root/src/utils';
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
import SiteIcon from '@root/src/components/site-icon/SiteIcon';
import { cn } from '@root/src/utils/cn';

interface IGroupedTabs {
  index: number | string;
  canMove: boolean;
  isFolder?: boolean;
  canRename?: boolean;
  children: number[];
  data: IGroup | ITab | { id: number };
}

// map tabs
const mapTabToGroups = (tabs: ITab[], groups: IGroup[]) => {
  const groupedTabs: Record<number | string, IGroupedTabs> = {
    root: {
      index: 'root',
      isFolder: false,
      canMove: false,
      children: [],
      data: { id: -1 },
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

    if (item?.groupId < 1 || groups?.length < 1) {
      groupedTabs['root'].children.push(item.id);
      return;
    }

    const group = groups?.find(g => g.id === item?.groupId);

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

// discarded tabs
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

  // track dragging state
  const [draggingItem, setDraggingItem] = useState(null);

  const tabsTree = useRef<TreeRef>(null);

  // used ref to store the value to access in a hook outside
  // that didn't get the updated state in the callback
  const selectedTabsRef = useRef<number[]>([]);

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

    console.log('🚀 ~ useEffect ~ selectedTabs:', selectedTabs);
  }, [selectedTabs]);

  console.log('🚀 ~ useEffect ~ selectedTabsRef.current:', selectedTabsRef.current);

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
    const ids = selectedTabsRef.current;

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

  const isTabDiscarded = useCallback((id: number) => discardedTabIDs.some(tabId => tabId === id), [discardedTabIDs]);

  const onTabClick = useCallback(
    async (tab: ITab) => {
      console.log('🚀 ~ tab:', tab);

      // ctrl/cmd is pressed
      if (isMetaKeyPressed) {
        await handleGoToTab(tab.id, tab.index);
        return;
      }

      // shift key was pressed (multi select)
      if (isShiftKeyPressed) {
        const lastSelectedTabIndex = !Number.isNaN(Number(selectedTabs[selectedTabs.length - 1]))
          ? selectedTabs[selectedTabs.length - 1]
          : activeSpace.activeTabIndex;

        const tabIsBeforeLastSelectedTab = tab.index < lastSelectedTabIndex;

        const tabsInRange: ITab[] = activeSpaceTabs
          .map((t, idx) => ({ ...t, index: idx }))
          .filter((t, idx) => {
            // duplicate tab
            if (selectedTabs[t.id]) return false;

            // select range above or below last selected tab
            if (tabIsBeforeLastSelectedTab) {
              return idx <= lastSelectedTabIndex && idx >= tab.index;
            }
            return idx >= lastSelectedTabIndex && idx <= tab.index;
          });

        if (selectedTabs.includes(tab.id)) {
          // unselect tabs
          setSelectedTabs(prev => [...prev.filter(t1 => !tabsInRange.find(t2 => t2.id === t1))]);
        } else {
          // select tabs
          setSelectedTabs(prev => [...prev, ...tabsInRange.map(t => t.id)]);
        }
        return;
      }

      // select tab
      if (!selectedTabs.includes(tab.id)) {
        setSelectedTabs(prev => [...prev, tab.id]);
      } else {
        // un-select tab (already selected)
        setSelectedTabs(prev => [...prev.filter(t => t !== tab.id)]);
      }
    },
    [
      activeSpace.activeTabIndex,
      isMetaKeyPressed,
      isShiftKeyPressed,
      handleGoToTab,
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
            {selectedTabs.includes(tab.id) ? (
              <motion.div
                {...bounce}
                className={`absolute w-[99%] top-0 left-0 rounded-lg border border-gray-500/90 bg-brand-darkBgAccent/80 z-10 pointer-events-none`}
                style={{
                  height: TAB_HEIGHT + 'px',
                  borderWidth: areTabsBeingDragged && !isDragging ? '3px' : '1px',
                }}></motion.div>
            ) : null}

            {areTabsBeingDragged && selectedTabs.includes(tab.id) && !isDragging ? (
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
      <ControlledTreeEnvironment
        canDragAndDrop={true}
        canDropOnFolder={true}
        canDropOnNonFolder={false}
        canReorderItems={true}
        items={groupedTabs}
        viewState={{
          ['active-space-tabs']: {
            expandedItems: activeSpaceGroups?.map(g => g.id) || [],
          },
        }}
        //TODO - handle group collapse
        onCollapseItem={() => {}}
        onExpandItem={() => {}}
        // handle select item
        // onSelectItems={items => {
        //   const selectedTabsIds = items?.filter(idx => !isNaN(Number(idx))).map(item => Number(item));

        //   console.log('🚀 ~ ActiveSpaceTabs ~ selectedTabsIds:', selectedTabsIds);

        //   setSelectedTabs(prev => [...prev, ...selectedTabsIds]);
        // }}
        // TODO - handle drop in item
        onDrop={() => {}}
        defaultInteractionMode={{
          mode: 'custom',
          // @ts-expect-error - lib code
          extends: 'click-item-to-expand',
          createInteractiveElementProps: (item, _treeId, action) => ({
            onDragStart: () => {
              // handle drag start
              setDraggingItem(item.data.id);
              action.startDragging();
            },
            onDragEnd: () => {
              // handle drag end
              setDraggingItem(null);
            },
          }),
        }}
        getItemTitle={item =>
          'name' in item.data ? item.data.name : 'title' in item.data ? item.data.title : item.index.toString()
        }
        renderDragBetweenLine={({ lineProps }) => (
          <hr {...lineProps} className="h-[2.5px] w-full bg-brand-primary rounded-xl" />
        )}
        renderItemArrow={({ item, context }) =>
          item.isFolder ? (
            <>
              <span {...context.arrowProps} className="flex items-center">
                <ChevronDownIcon
                  className={`text-slate-500/80 transition-transform duration-300 ${
                    context?.isExpanded ? 'rotate-180' : ''
                  }`}
                />
              </span>
            </>
          ) : null
        }
        renderItemTitle={({ title, item }) => (
          <div className={'w-full flex items-center overflow-hidden h-full'} style={{}}>
            {item.isFolder ? (
              <></>
            ) : (
              <SiteIcon
                siteURl={(item?.data as ITab).url}
                classes={cn('size-[17px] max-w-[17px] z-10 border-none', { grayscale: isTabDiscarded(item.data.id) })}
              />
            )}
            <p
              className={
                'text-[13px] ml-px text-slate-300/80 max-w-[95%] z-10 whitespace-nowrap overflow-hidden text-ellipsis text-start bg-indigo-600'
              }>
              {title?.trim() || 'No title'}
            </p>
            {item.isFolder ? (
              <span
                className="size-[8px] rounded-full block ml-1.5 -mb-px opacity-95"
                style={{ backgroundColor: (item?.data as IGroup).theme }}></span>
            ) : null}
          </div>
        )}
        renderItem={({ title, arrow, context, children, item }) => (
          <li
            {...context.itemContainerWithChildrenProps}
            tabIndex={-1}
            className="items-start m-0 flex flex-col w-full">
            <TabContextMenu
              space={space}
              allTabs={activeSpaceTabs}
              selectedTabs={selectedTabs}
              setActiveSpaceTabs={setActiveSpaceTabs}
              tab={item.data as ITab}
              onRemoveClick={() => {}}>
              {/* @ts-expect-error - lib code */}
              <button
                tabIndex={-1}
                {...context.itemContainerWithoutChildrenProps}
                {...context.interactiveElementProps}
                onClick={() => {
                  if (item.isFolder) return;
                  onTabClick(item.data as ITab);
                }}
                style={{
                  height: TAB_HEIGHT + 'px',
                }}
                onDoubleClick={() => {
                  if (item.isFolder) return;
                  onTabDoubleClickHandler(item.data?.id, (item.data as ITab).index);
                }}
                className={cn(
                  'relative w-full bg-emerald-70 flex items-center justify-between text-slate-300/70 text-[13px] px-2 group z-20 rounded-lg outline-none',
                  {
                    // group's style
                    'bg-brand-darkBgAccent/60': item.isFolder,
                  },
                  {
                    // group expanded
                    'rounded-b-none border-b border-slate-800': item.isFolder && context?.isExpanded,
                  },
                  {
                    // discarded tab
                    'opacity-90': isTabDiscarded(item.data.id),
                  },
                  {
                    // style for tabs inside group
                    'bg-brand-darkBg/40': (item.data as ITab).groupId > 0,
                  },
                  {
                    //active tab
                    'bg-brand-darkBgAccent/40 border border-slate-700/70':
                      space.activeTabIndex === (item.data as ITab).index,
                  },
                  {
                    //selected tab bg
                    'bg-brand-darkBgAccent/40': selectedTabs.includes((item.data as ITab).id),
                  },
                  {
                    'bg-red-600 border border-red-600': draggingItem === item.data.id,
                  },
                )}>
                {title}
                {/* group arrow */}
                <span>{arrow}</span>
                {/* selected tab  */}
                {selectedTabs.includes((item.data as ITab).id) ? (
                  <motion.div
                    {...bounce}
                    className={`absolute w-full top-0 left-0 rounded-lg border border-gray-500/80 bg-brand-darkBgAccent/40 -z-10  pointer-events-none`}
                    style={{
                      height: TAB_HEIGHT + 'px',
                      borderWidth: '1px',
                    }}></motion.div>
                ) : null}
                {/* hover options */}
                {!item.isFolder && !draggingItem ? (
                  <>
                    {/*  eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <span
                      className="absolute opacity-0 hidden group-hover:flex group-hover:opacity-100 transition-all duration-300 right-[8px] items-center gap-x-3 shadow-md shadow-slate-800"
                      onClick={ev => ev.stopPropagation()}>
                      {/* open tab  */}
                      <ExternalLinkIcon
                        className={`text-slate-400 rounded bg-brand-darkBgAccent text-xs cursor-pointer py-[2px] px-[3.5px] scale-[1.6] transition-all duration-200 hover:bg-brand-darkBgAccent/95`}
                        onClick={() => handleGoToTab(item.data?.id, (item.data as ITab).index)}
                      />
                      <CopyIcon
                        className={`text-slate-400 rounded bg-brand-darkBgAccent text-xs cursor-pointer py-[2px] px-[3.5px] scale-[1.6] transition-all duration-200 hover:bg-brand-darkBgAccent/95`}
                        onClick={async () => await copyToClipboard((item.data as ITab).url)}
                      />
                      <Cross1Icon
                        className={`text-slate-400 rounded bg-brand-darkBgAccent text-xs cursor-pointer py-[2px] px-[3.5px] scale-[1.6] transition-all duration-200 hover:bg-brand-darkBgAccent/95`}
                        onClick={() => handleRemoveTab(item.data?.id)}
                      />
                    </span>
                  </>
                ) : null}
              </button>
            </TabContextMenu>
            {children}
          </li>
        )}
        renderTreeContainer={({ children, containerProps }) => <div {...containerProps}>{children}</div>}
        renderItemsContainer={({ children, containerProps, parentId }) => (
          // @ts-expect-error - lib props
          <motion.ul
            {...(parentId !== 'root' ? { ...bounce } : {})}
            className={cn('w-full', { 'bg-brand-darkBgAccent/40 rounded-b-md px-1.5': parentId !== 'root' })}
            {...containerProps}>
            {children}
          </motion.ul>
        )}>
        <Tree ref={tabsTree} treeId="active-space-tabs" rootItem="root" treeLabel="Tree Example" />
      </ControlledTreeEnvironment>
    </div>
  );
};

export default memo(ActiveSpaceTabs);
