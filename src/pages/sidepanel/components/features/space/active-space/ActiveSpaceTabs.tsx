// lib styles
import 'react-complex-tree/lib/style-modern.css';

import { motion } from 'framer-motion';
import { useHotkeys } from 'react-hotkeys-hook';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useState, useCallback, useEffect, useRef, memo } from 'react';
import { CopyIcon, Cross1Icon, ChevronDownIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import {
  Tree,
  ControlledTreeEnvironment,
  type TreeRef,
  type DraggingPosition,
  type TreeItem,
} from 'react-complex-tree';

import { cn } from '@root/src/utils/cn';
import TabContextMenu from './TabContextMenu';
import { copyToClipboard, logger } from '@root/src/utils';
import SiteIcon from '@root/src/components/site-icon/SiteIcon';
import { DISCARD_TAB_URL_PREFIX } from '@root/src/constants/app';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { goToTab, syncTabs } from '@root/src/services/chrome-tabs/tabs';
import { useCustomAnimation } from '../../../../hooks/useCustomAnimation';
import { setGroupsToSpace } from '@root/src/services/chrome-storage/groups';
import { useMetaKeyPressed } from '@root/src/pages/sidepanel/hooks/use-key-shortcuts';
import { IGroup, IMessageEventSidePanel, ISpace, ITab } from '@root/src/types/global.types';
import { removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import {
  activeSpaceAtom,
  activeSpaceGroupsAtom,
  activeSpaceTabsAtom,
  selectedTabsAtom,
  updateSpaceAtom,
} from '@root/src/stores/app';

interface IGroupedTabs {
  index: number | string;
  canMove: boolean;
  isFolder?: boolean;
  canRename?: boolean;
  children: number[];
  data: (IGroup | { id: number } | ITab) & { type: 'group' | 'tab' | 'root' };
}

// map tabs
const mapTabToGroups = (tabs: ITab[], groups: IGroup[]) => {
  const groupedTabs: Record<number | string, IGroupedTabs> = {
    root: {
      index: 'root',
      isFolder: false,
      canMove: false,
      children: [],
      data: { id: -1, type: 'root' },
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

    groupedTabs[item.id] = { ...tabItem, data: { ...tabItem.data, type: 'tab' } };

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

      groupedTabs[group.id] = { ...groupItem, data: { ...groupItem.data, type: 'group' } };
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

  const [groupedTabs, setGroupedTabs] = useState<Record<string | number, IGroupedTabs>>({});

  useEffect(() => {
    const groups = mapTabToGroups(activeSpaceTabs, activeSpaceGroups);

    console.log('🚀 ~ useEffect ~ groups:', groups);

    setGroupedTabs(groups);
  }, [activeSpaceTabs, activeSpaceGroups]);

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
  }, [selectedTabs]);

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

  const isTabDiscarded = useCallback(
    (id: number, url?: string) =>
      discardedTabIDs.some(tabId => tabId === id) || url?.startsWith(DISCARD_TAB_URL_PREFIX),
    [discardedTabIDs],
  );

  const onTabClick = useCallback(
    async (tab: ITab) => {
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
        // add new add at the sorted index of main tabs
        const sortedTabs = activeSpaceTabs.sort((a, b) => a.index - b.index);

        const newSelectedTabs = sortedTabs
          .filter(sT => sT.id === tab.id || selectedTabs.includes(sT.id))
          .map(t => t.id);
        setSelectedTabs(newSelectedTabs);
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

  // update storage and ui state for tabs and groups
  const updateTabsAndGroupState = useCallback(async () => {
    // get current group & tab data from chrome
    const { tabs, groups, activeTab } = await syncTabs(space.id, space.windowId);

    if (activeTab.index !== space.activeTabIndex) {
      // update active tab index
      updateSpaceState({ ...space, activeTabIndex: activeTab.index });
      updateSpace(space.id, { activeTabIndex: activeTab.index });
    }

    // update storage
    await setGroupsToSpace(space.id, groups);
    await setTabsForSpace(space.id, tabs);
    // update ui state
    setActiveSpaceTabs(tabs);
    setActiveSpaceGroups(groups);

    return;
  }, [setActiveSpaceGroups, setActiveSpaceTabs, space, updateSpaceState]);

  // * drop handler
  const onDropHandler = async (
    items: TreeItem<(IGroup | ITab) & { type: 'tab' | 'group' }>[],
    target: DraggingPosition,
  ) => {
    console.log('✅ ~ getTabIndexClosestToTarget:349 ~ target:', target);

    const getTabIndexClosestToTarget = () => {
      // @ts-expect-errors childIndex is included
      const droppedIndex = Math.max(target?.childIndex - 1, 0);

      if (droppedIndex < 1) return 0;

      if (target.targetType === 'between-items' && target.parentItem !== 'root') {
        const closestTabId = groupedTabs[target.parentItem].children[droppedIndex];
        return (groupedTabs[closestTabId].data as ITab).index;
      }

      let tab = groupedTabs['root'].children[droppedIndex];

      if (groupedTabs[tab]?.isFolder) {
        tab = groupedTabs[tab].children[groupedTabs[tab].children.length - 1];
      }
      return (groupedTabs[tab].data as ITab).index;
    };

    //  get the index of the tab at the dropped location and adjust the dropped-index accordingly
    let targetIndex = target.targetType !== 'item' ? getTabIndexClosestToTarget() : 0;

    const hasMovedUpward =
      items[0]?.data.type === 'group'
        ? // @ts-expect-errors childIndex is included
          groupedTabs['root'].children?.findIndex(t => t === items[0].data.id) > target?.childIndex
        : (items[0]?.data as ITab).index > targetIndex;

    if (hasMovedUpward && targetIndex > 0) targetIndex++;

    if (items[0]?.data.type === 'group') {
      // handle group dropped on a group (merge)
      if (target.targetType === 'item') {
        // add the dragged group's tab to the target group

        const tabsInDraggedGroup = activeSpaceTabs.filter(t1 => t1.groupId === items[0].data.id).map(t2 => t2.id);

        await chrome.tabs.group({
          tabIds: tabsInDraggedGroup,
          groupId: target.targetItem as number,
        });

        return;
      }

      //  handle group dropped inside a group
      if (target.targetType === 'between-items' && target.parentItem !== 'root') {
        // add dragged groups tabs to the target group at dropped index
        const tabsInDraggedGroup = activeSpaceTabs.filter(t1 => t1.groupId === items[0].data.id).map(t2 => t2.id);

        // add tabs to target group
        await chrome.tabs.group({
          tabIds: tabsInDraggedGroup,
          groupId: target.parentItem as number,
        });
        // move tabs to the dropped index
        const moveTabsPromises = tabsInDraggedGroup.map(async tabId => {
          return chrome.tabs.move(tabId, { index: targetIndex });
        });

        await Promise.allSettled(moveTabsPromises);
        return;
      }

      // handle move group
      await chrome.tabGroups.move(items[0].data.id, {
        index: hasMovedUpward ? targetIndex : targetIndex - Math.max(items[0]?.children?.length - 1 || 0, 0),
      });

      await updateTabsAndGroupState();

      return;
    }

    //  single tab drop
    const tabToMove = items[0].data as ITab | IGroup;

    // check if dropped on a group
    const droppedOnGroupId = target.targetType === 'item' ? target.targetItem : null;

    if (droppedOnGroupId) {
      // add tabs to group
      const tabs = selectedTabs?.length > 0 ? selectedTabs : [tabToMove.id];
      await chrome.tabs.group({
        tabIds: tabs,
        groupId: droppedOnGroupId as number,
      });
      await updateTabsAndGroupState();
      return;
    }

    // check dropped inside a group
    if (target.targetType === 'between-items' && target.parentItem !== 'root') {
      //  move multiple tabs if selected
      const tabs = selectedTabs?.length > 0 ? selectedTabs : [tabToMove.id];

      // move tabs
      const moveTabsPromises = tabs.map(async tabId => {
        return chrome.tabs.move(tabId, { index: targetIndex });
      });

      await Promise.allSettled(moveTabsPromises);
      // add tabs to group
      chrome.tabs.group({
        tabIds: tabs,
        groupId: target.parentItem as number,
      });

      await updateTabsAndGroupState();
      return;
    }

    // dropped index for tab dropped in the root/base container (index is the tab of thz tab at the previous pos)

    //  multiple tabs drop
    const tabs = selectedTabs?.length > 0 ? selectedTabs : [tabToMove.id];

    // move tabs
    const moveTabsPromises = tabs.map(async tabId => {
      return chrome.tabs.move(tabId, { index: targetIndex });
    });

    await Promise.allSettled(moveTabsPromises);

    if ((tabToMove as ITab).groupId) {
      // remove tab from group
      await chrome.tabs.ungroup(tabToMove.id);
    }
    // await chrome.tabs.move(tabToMove.id, { index: tabIndex + 1 });
    await updateTabsAndGroupState();
  };

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
            expandedItems: activeSpaceGroups?.filter(g => !g.collapsed)?.map(g1 => g1.id) || [],
          },
        }}
        // handle drop in item
        onDrop={onDropHandler}
        defaultInteractionMode={{
          mode: 'custom',
          // @ts-expect-error - lib code
          extends: 'click-item-to-expand',
          createInteractiveElementProps: (item, _treeId, action) => ({
            onDragStart: async () => {
              // if (item.data.type === 'group' && !item.data.collapsed) {
              //   await chrome.tabGroups.update(item.data.id, {
              //     collapsed: true,
              //   });
              // }
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
          <hr {...lineProps} className="h-[2.5px] w-[calc(100%+20px)] bg-brand-primary rounded-xl z-[999] -ml-2" />
        )}
        renderItemArrow={({ item, context }) =>
          item.isFolder ? (
            <span {...context.arrowProps} className="flex items-center">
              <ChevronDownIcon
                className={`text-slate-500/80 transition-transform duration-300 ${
                  context?.isExpanded ? 'rotate-180' : ''
                }`}
              />
            </span>
          ) : null
        }
        renderItemTitle={({ title, item }) => (
          <div className={'w-full flex items-center overflow-hidden h-full'}>
            {item.isFolder ? (
              <></>
            ) : (
              <SiteIcon
                siteURl={(item?.data as ITab).url}
                classes={cn('size-[17px] max-w-[17px] z-10 border-none', {
                  grayscale: isTabDiscarded(item.data.id, (item.data as ITab)?.url),
                })}
              />
            )}
            <p
              className={
                'text-[13px] ml-px text-slate-300/80 max-w-[95%] z-10 whitespace-nowrap overflow-hidden text-ellipsis text-start'
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
                onClick={async () => {
                  if (item.isFolder) {
                    // collapse/expand group
                    await chrome.tabGroups.update(item.data.id, {
                      collapsed: !(item.data as IGroup).collapsed,
                    });
                    return;
                  }
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
                    'bg-brand-darkBgAccent/60 shadow-md shadow-brand-darkBgAccent/40 px-2.5': item.isFolder,
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
                    // active tab
                    'bg-brand-darkBgAccent/30 border border-slate-600/80  shadow shadow-brand-darkBgAccent/40':
                      space.activeTabIndex === (item.data as ITab).index,
                  },
                  {
                    // selected tab bg
                    'bg-brand-darkBgAccent/40': selectedTabs.includes((item.data as ITab).id),
                  },
                  {
                    // selected tab bg
                    'bg-rose-400/40': context?.isDraggingOver,
                  },
                  {
                    // on drag
                    'bg-brand-darkBgAccent border border-slate-800/80': draggingItem === item.data.id,
                  },
                  {
                    // selected tab on drag
                    'opacity-60':
                      !!draggingItem &&
                      draggingItem !== item.data.id &&
                      selectedTabs.length > 1 &&
                      selectedTabs.includes(item.data.id),
                  },
                )}>
                {title}
                {/* group arrow */}
                <span>{arrow}</span>
                {/* selected tab  */}
                {selectedTabs.includes((item.data as ITab).id) ? (
                  <motion.div
                    {...bounce}
                    className={`absolute w-full top-0 left-0 rounded-lg border border-gray-500/80 bg-brand-darkBgAccent/40 -z-10  pointer-events-none border-collapse`}
                    style={{
                      height: TAB_HEIGHT + 'px',
                      borderWidth: '1px',
                    }}></motion.div>
                ) : null}

                {/* dragging multiple tabs indicator */}
                {draggingItem === item.data.id && selectedTabs?.length > 0 ? (
                  <>
                    {/* multiple tabs  */}
                    {selectedTabs.length > 1 ? (
                      <span
                        className={`w-6 h-6 rounded-lg px-1 py-1 absolute -top-[8px] -left-[6px] text-[11px] z-[200] border border-slate-600
                                  flex items-center justify-center font-semibold  bg-brand-darkBgAccent text-slate-300/80`}>
                        +{selectedTabs?.length - 1}
                      </span>
                    ) : null}

                    {/* tabs stacked effect  */}
                    {['one', 'two'].map((v, ix) => (
                      <div
                        key={v}
                        className="absolute   w-full -z-10 rounded-lg  border border-slate-700/70 bg-brand-darkBgAccent/60"
                        style={{
                          height: TAB_HEIGHT + 'px',
                          top: `-${(ix + 0.25) * 2}px`,
                          left: `-${(ix + 0.25) * 2}px`,
                        }}></div>
                    ))}
                  </>
                ) : null}

                {/* hover options */}
                {!item.isFolder && !draggingItem ? (
                  <>
                    {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
                    <span
                      className="absolute opacity-0 hidden group-hover:flex group-hover:opacity-100 z-20 transition-all duration-300 right-[8px] items-center gap-x-3 shadow-md shadow-slate-800"
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
          // @ts-expect-error - lib code
          <motion.ul
            {...(parentId !== 'root' ? { ...bounce } : {})}
            className={cn('w-full ', { 'bg-brand-darkBgAccent/40 rounded-b-md px-1.5': parentId !== 'root' })}
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
