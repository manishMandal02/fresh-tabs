import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { useAtom } from 'jotai';
import { activeSpaceAtom, nonActiveSpacesAtom, selectedTabsAtom } from '@root/src/stores/app';
import { getAllSpaces, getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import { IMessageEvent, ISpaceWithTabs, ITab } from '../../types/global.types';
import { MutableRefObject, useCallback, Dispatch, useState, SetStateAction } from 'react';
import { logger } from '../../utils/logger';
import type { OnDragEndResponder, OnBeforeDragStartResponder } from 'react-beautiful-dnd';
import { useTabsDnd } from './useTabsDnd';

export const useSidePanel = (setActiveSpaceTabs: Dispatch<SetStateAction<ITab[]>>) => {
  // non active spaces  (global state)
  const [, setNonActiveSpaces] = useAtom(nonActiveSpacesAtom);

  // active space atom (global state)
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);

  // selected tabs (global state)
  const [selectedTabs] = useAtom(selectedTabsAtom);

  // local state
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);
  // local state
  const [isDraggingSpace, setIsDraggingSpace] = useState(false);

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

  const { dropHandler, getDroppedLocation } = useTabsDnd();

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

      if (!result.destination && !result?.combine?.draggableId) {
        return;
      }

      // TODO - test the full DnD flow
      // check the flag conditions to run the drop handler, and when to not execute

      const droppableId = result.destination?.droppableId || result.combine?.droppableId;

      // determine drop location
      const droppedLocation = getDroppedLocation(droppableId);

      // main drop handler
      (async () => {
        await dropHandler({
          droppedLocation,
          droppableId,
          draggableId: result.draggableId,
          sourceIndex: result.source.index,
          destinationIndex: result.destination?.index || 0,
          combineDraggableId: result.combine?.draggableId || null,
        });
      })();
    },
    [dropHandler, getDroppedLocation],
  );

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

          try {
            // check if the active tab has changed from side panel, if yes do nothing
            const [activeTab] = await chrome.tabs.query({ active: true, windowId: activeSpaceRef.current.windowId });

            if (activeTab?.index === activeSpaceRef.current.activeTabIndex) break;

            setActiveSpace({ ...activeSpaceRef.current, activeTabIndex: activeTab?.index });
          } catch (err) {
            logger.info(`Tab not found: ${err}`);
            setActiveSpace({ ...activeSpaceRef.current, activeTabIndex: payload?.newActiveIndex });
          }
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

  return {
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
