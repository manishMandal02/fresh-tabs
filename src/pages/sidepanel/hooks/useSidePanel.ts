import { useAtom } from 'jotai';
import { MutableRefObject, useCallback } from 'react';

import { useTabsDnd } from './useTabsDnd';
import { logger } from '../../utils/logger';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import { IMessageEventSidePanel, ISpaceWithTabs } from '../../types/global.types';
import { getAllSpaces, getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import type { OnDragEndResponder, OnBeforeDragStartResponder } from 'react-beautiful-dnd';
import { activeSpaceAtom, dragStateAtom, nonActiveSpacesAtom } from '@root/src/stores/app';

export const useSidePanel = () => {
  // non active spaces  (global state)
  const [, setNonActiveSpaces] = useAtom(nonActiveSpacesAtom);

  // active space atom (global state)
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);

  // dragging state
  const [, setDragging] = useAtom(dragStateAtom);

  // get all spaces from storage
  const getAllSpacesStorage = async () => {
    // get all the spaces
    const allSpaces = await getAllSpaces();

    const windowId = await getCurrentWindowId();

    // get currentSpace
    const currentSpace = await getSpaceByWindow(windowId);

    const tabsFroCurrentSpace = await getTabsInSpace(currentSpace?.id);

    const activeSpaceWithTabs = { ...currentSpace, tabs: tabsFroCurrentSpace };

    return { activeSpaceWithTabs, otherSpaces: allSpaces };
  };

  const { dropHandler, getDroppedLocation } = useTabsDnd();

  // handle tab drag start
  const onTabsDragStart: OnBeforeDragStartResponder = useCallback(
    start => {
      // set global dragging state
      if (start.type === 'TAB') {
        setDragging({ isDragging: true, type: 'tabs' });
        return;
      }

      setDragging({ isDragging: true, type: 'space' });
    },
    [setDragging],
  );

  // handle tabs drag end
  const onTabsDragEnd: OnDragEndResponder = useCallback(
    result => {
      // reset dragging state
      setDragging({ isDragging: false, type: null });

      if (!result.destination && !result?.combine?.draggableId) {
        return;
      }

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
    [dropHandler, getDroppedLocation, setDragging],
  );

  // handle background events
  const handleEvents = useCallback(
    async ({ event, payload }: IMessageEventSidePanel, activeSpaceRef: MutableRefObject<ISpaceWithTabs>) => {
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

            if (!activeTab?.id) throw new Error('no active tabs in this window.');

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
  };
};
