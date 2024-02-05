import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { useAtom } from 'jotai';
import { activeSpaceAtom, nonActiveSpacesAtom, selectedTabsAtom } from '@root/src/stores/app';
import { getAllSpaces, getSpaceByWindow, updateSpace } from '@root/src/services/chrome-storage/spaces';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import { IMessageEvent, ISpaceWithTabs, ITab } from '../../types/global.types';
import { MutableRefObject, useCallback, Dispatch, useState, SetStateAction } from 'react';
import { logger } from '../../utils/logger';
import type { OnDragEndResponder, OnBeforeDragStartResponder } from 'react-beautiful-dnd';

export const useSidePanel = (setActiveSpaceTabs: Dispatch<SetStateAction<ITab[]>>) => {
  // non active spaces  (global state)
  const [nonActiveSpaces, setNonActiveSpaces] = useAtom(nonActiveSpacesAtom);

  // active space atom (global state)
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);

  // local state
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  // local state
  const [isDraggingSpace, setIsDraggingSpace] = useState(false);

  // selected tabs (global state)
  const [selectedTabs] = useAtom(selectedTabsAtom);

  // get all spaces from storage
  const getAllSpacesStorage = async () => {
    // get all the spaces
    const allSpaces = await getAllSpaces();

    const windowId = await getCurrentWindowId();

    // get currentSpace
    const currentSpace = await getSpaceByWindow(windowId);

    const tabsFroCurrentSpace = await getTabsInSpace(currentSpace?.id);

    const activeSpaceWithTabs = { ...currentSpace, tabs: tabsFroCurrentSpace };

    return { activeSpaceWithTabs, otherSpaces: [...allSpaces.filter(s => s.id !== currentSpace?.id)] };
  };

  // handle background events
  const handleEvents = useCallback(
    async ({ event, payload }: IMessageEvent, activeSpaceRef: MutableRefObject<ISpaceWithTabs>) => {
      switch (event) {
        case 'ADD_SPACE': {
          // add new space
          setNonActiveSpaces(prev => [...prev, payload.space]);
          break;
        }

        case 'REMOVE_SPACE': {
          // remove space
          setNonActiveSpaces(prev => [...prev.filter(s => s.id !== payload.spaceId)]);
          break;
        }

        case 'UPDATE_SPACE_ACTIVE_TAB': {
          if (payload.spaceId !== activeSpaceRef.current?.id) return;
          // check if the active tab has changed from side panel, if yes do nothing
          const tab = await chrome.tabs.get(activeSpaceRef.current.tabs[activeSpaceRef.current.activeTabIndex]?.id);
          if (tab?.active) return;

          setActiveSpace({ ...activeSpaceRef.current, activeTabIndex: payload.newActiveIndex });

          break;
        }

        case 'UPDATE_TABS': {
          // get updated tabs from storage
          if (payload.spaceId !== activeSpaceRef.current?.id) return;

          const updatedTabs = await getTabsInSpace(payload.spaceId);

          setActiveSpace({ ...activeSpaceRef.current, tabs: updatedTabs });
          break;
        }

        default: {
          logger.info(`Unknown event: ${event} `);
        }
      }
    },
    [setActiveSpace, setNonActiveSpaces],
  );

  // handle tab drag start
  const onTabsDragStart: OnBeforeDragStartResponder = useCallback(
    start => {
      // set dragging only if tab is dragged (tab id is a number)
      if (start.type === 'TAB') {
        setIsDraggingTabs(true);
      } else {
        setIsDraggingSpace(true);
      }
      if (selectedTabs?.length < 1) return;

      // remove tabs temporarily on drag starts, except the tab being dragged
      const updatedTabs = activeSpace?.tabs.filter(
        aT => !selectedTabs.find(sT => sT.id === aT.id && sT.id.toString() !== start.draggableId),
      );

      setActiveSpaceTabs([...updatedTabs]);
    },

    [selectedTabs, setActiveSpaceTabs, activeSpace?.tabs],
  );

  // handle tabs drag end
  const onTabsDragEnd: OnDragEndResponder = useCallback(
    result => {
      // reset dragging state
      setIsDraggingTabs(false);
      setIsDraggingSpace(false);

      if (!result.destination) {
        return;
      }

      if (result.destination.index === result.source.index && selectedTabs.length < 1) return;

      const droppedSpaceId = result.destination.droppableId;

      const activeTab = activeSpace?.tabs[activeSpace.activeTabIndex];

      let reOrderedTabs = [...activeSpace.tabs];

      // check if this is multi drop
      if (selectedTabs?.length > 0) {
        // remove selected tabs for active space
        reOrderedTabs = reOrderedTabs.filter(aT => !selectedTabs.find(sT => sT.id === aT.id));

        if (droppedSpaceId === activeSpace?.id) {
          //  dropped in same space

          // check if the tabs are moved up or down from it's previous pos
          const didTabsMoveDownward = result.source.index < result.destination.index;

          // calculate dropped index
          const droppedIndex = didTabsMoveDownward
            ? 1 + result.destination.index - selectedTabs.length
            : result.destination.index;

          // sort the selected tabs by index
          const sortedSelectedTabs: ITab[] = selectedTabs
            .toSorted((t1, t2) => (t1.index > t2.index ? 1 : -1))
            .map(t => ({ id: t.id, title: t.title, url: t.url }));

          // add selected tabs at dropped pos in active space
          reOrderedTabs = reOrderedTabs.toSpliced(droppedIndex, 0, ...sortedSelectedTabs);

          // find new active tab index
          const newActiveTabIndex = reOrderedTabs.findIndex(el => el.url === activeTab.url);

          // move tab in window
          setActiveSpace(prev => ({ ...prev, tabs: reOrderedTabs }));

          if (!didTabsMoveDownward) {
            sortedSelectedTabs.reverse();
          }

          // grouping all chrome api calls to move tabs
          const moveTabsPromises = sortedSelectedTabs.map(async tab => {
            const index = result.destination.index;

            return chrome.tabs.move(tab.id, { index });
          });

          (async () => {
            try {
              // update storage
              await setTabsForSpace(activeSpace.id, reOrderedTabs);

              await Promise.allSettled(moveTabsPromises);
            } catch (error) {
              console.log('🚀 ~ error:', error);
            }

            // update space's active tab index, if changed
            if (activeSpace.activeTabIndex !== newActiveTabIndex) {
              await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
            }
          })();
        } else {
          // dropped in different space
          // todo - if dropped into other space, update that active space & other spaces
          // todo - update ui - local/global state to rerender ui
        }
        // re-add removed tabs if dropped to outside dropzone (resetting to same pos)

        setActiveSpaceTabs([...activeSpace.tabs]);

        return;
      }

      // handle single tab drop
      const [tabToMove] = reOrderedTabs.splice(result.source.index, 1);

      // check if dropped in active space or other space
      if (droppedSpaceId === activeSpace?.id) {
        // update the dropped tab position
        reOrderedTabs.splice(result.destination.index, 0, tabToMove);

        // find new active tab index
        const newActiveTabIndex = reOrderedTabs.findIndex(el => el.url === activeTab.url);

        (async () => {
          // move tab in window
          await chrome.tabs.move(tabToMove.id, { index: result.destination.index });
          // update storage
          await setTabsForSpace(activeSpace.id, reOrderedTabs);
          // update space's active tab index, if changed
          if (activeSpace.activeTabIndex !== newActiveTabIndex) {
            await updateSpace(activeSpace.id, { ...activeSpace, activeTabIndex: newActiveTabIndex });
          }
        })();

        // save local ui state
        setActiveSpace({
          ...activeSpace,
          activeTabIndex: newActiveTabIndex,
          tabs: reOrderedTabs,
        });
      } else {
        // if no then remove tab from active space and rearrange tabs
        (async () => {
          // save the tabs (with removed dragged tab) in active space
          await setTabsForSpace(activeSpace.id, reOrderedTabs);
          // add tab to new dragged space
          const tabsInNewSpace = await getTabsInSpace(droppedSpaceId);
          await setTabsForSpace(droppedSpaceId, [...tabsInNewSpace, tabToMove]);
          // save local ui state
          setActiveSpace({
            ...activeSpace,

            activeTabIndex: reOrderedTabs.findIndex(el => el.url === activeTab.url),
            tabs: reOrderedTabs,
          });
        })();
      }
    },
    [activeSpace, selectedTabs, setActiveSpaceTabs, setActiveSpace],
  );

  return {
    nonActiveSpaces,
    setNonActiveSpaces,
    getAllSpacesStorage,
    handleEvents,
    onTabsDragEnd,
    onTabsDragStart,
    activeSpace,
    setActiveSpace,
    isDraggingTabs,
    isDraggingSpace,
  };
};
