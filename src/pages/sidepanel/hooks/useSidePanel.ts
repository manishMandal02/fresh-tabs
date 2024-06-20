import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { MutableRefObject, useCallback } from 'react';

import { useTabsDnd } from './useTabsDnd';
import { logger } from '../../../utils/logger';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import {
  activeSpaceAtom,
  activeSpaceGroupsAtom,
  activeSpaceTabsAtom,
  addSpaceAtom,
  dragStateAtom,
  removeSpaceAtom,
  updateSpaceAtom,
  userNotificationsAtom,
} from '@root/src/stores/app';
import { IMessageEventSidePanel, ISpace } from '../../../types/global.types';
import { getAllSpaces, getSpace, getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import type { OnDragEndResponder, OnBeforeDragStartResponder } from 'react-beautiful-dnd';
import { getGroups } from '@root/src/services/chrome-storage/groups';
import { getAllNotifications } from '@root/src/services/chrome-storage/user-notifications';

export const useSidePanel = () => {
  // active space atom (global state)
  const activeSpace = useAtomValue(activeSpaceAtom);

  const addSpace = useSetAtom(addSpaceAtom);
  const updateSpace = useSetAtom(updateSpaceAtom);
  const removeSpace = useSetAtom(removeSpaceAtom);
  const setUserNotification = useSetAtom(userNotificationsAtom);
  const setActiveSpaceGroups = useSetAtom(activeSpaceGroupsAtom);

  const [activeSpaceTabs, setActiveSpaceTabs] = useAtom(activeSpaceTabsAtom);

  // dragging state
  const [, setDragging] = useAtom(dragStateAtom);

  // get all spaces from storage
  const getAllSpacesStorage = async () => {
    // get all the spaces
    const allSpaces = await getAllSpaces();

    const windowId = await getCurrentWindowId();

    // get currentSpace
    const currentSpace = await getSpaceByWindow(windowId);

    return { currentSpace, allSpaces };
  };

  const { dropHandler, getDroppedLocation } = useTabsDnd();

  // handle tab drag start - set global dragging state
  const onTabsDragStart: OnBeforeDragStartResponder = useCallback(
    () => setDragging({ isDragging: true, type: 'space' }),
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
    async ({ event, payload }: IMessageEventSidePanel, activeSpaceRef: MutableRefObject<ISpace>) => {
      switch (event) {
        case 'ADD_SPACE': {
          // add new space
          addSpace(payload.space);

          break;
        }

        case 'REMOVE_SPACE': {
          // remove space
          removeSpace(payload.spaceId);
          break;
        }

        case 'UPDATE_SPACE_ACTIVE_TAB': {
          if (payload.spaceId !== activeSpaceRef.current?.id) return;

          try {
            // check if the active tab has changed from side panel, if yes do nothing
            const [activeTab] = await chrome.tabs.query({ active: true, windowId: activeSpaceRef.current.windowId });

            if (!activeTab?.id) throw new Error('no active tabs in this window.');

            if (activeTab?.index === activeSpaceRef.current.activeTabIndex) break;

            updateSpace({ ...activeSpaceRef.current, activeTabIndex: activeTab?.index });
          } catch (err) {
            logger.info(`Tab not found: ${err}`);
            updateSpace({ ...activeSpaceRef.current, activeTabIndex: payload?.newActiveIndex });
          }
          break;
        }

        case 'UPDATE_TABS': {
          // get updated tabs from storage
          if (payload.spaceId !== activeSpaceRef.current?.id) return;

          const updatedTabs = await getTabsInSpace(payload.spaceId);

          setActiveSpaceTabs(updatedTabs);

          const space = await getSpace(payload.spaceId);

          if (space?.activeTabIndex !== activeSpaceRef.current.activeTabIndex) {
            updateSpace({ ...activeSpaceRef.current, activeTabIndex: space.activeTabIndex });
          }
          break;
        }
        case 'UPDATE_GROUPS': {
          // get updated tabs from storage
          if (payload.spaceId !== activeSpaceRef.current?.id) return;

          const updatedGroups = await getGroups(payload.spaceId);

          setActiveSpaceGroups(updatedGroups);

          break;
        }
        case 'UPDATE_NOTIFICATIONS': {
          if (payload.spaceId !== activeSpaceRef.current?.id) return;

          const allNotifications = await getAllNotifications();
          setUserNotification(allNotifications);
          break;
        }

        default: {
          logger.info(`Unknown event: ${event}`);
        }
      }
    },
    [addSpace, removeSpace, updateSpace, setActiveSpaceTabs, setActiveSpaceGroups, setUserNotification],
  );

  return {
    getAllSpacesStorage,
    handleEvents,
    onTabsDragEnd,
    onTabsDragStart,
    activeSpace,
    activeSpaceTabs,
  };
};
