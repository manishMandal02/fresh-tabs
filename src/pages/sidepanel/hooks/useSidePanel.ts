import { getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { useAtom } from 'jotai';
import { spacesAtom } from '@root/src/stores/app';
import { getAllSpaces, getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import { IMessageEvent, ISpaceWithTabs } from '../../types/global.types';
import { MutableRefObject, useCallback } from 'react';
import { logger } from '../../utils/logger';
import type { OnDragEndResponder } from 'react-beautiful-dnd';

type UseSidePanelProps = {
  activeSpace: ISpaceWithTabs;
  setActiveSpace: (space: ISpaceWithTabs) => void;
};

export const useSidePanel = ({ activeSpace, setActiveSpace }: UseSidePanelProps) => {
  // non active spaces atom (global state)
  const [nonActiveSpaces, setNonActiveSpaces] = useAtom(spacesAtom);
  // active space atom (global state)

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
      console.log('🚀 ~ handleEvents ~ payload:', payload);

      console.log('🚀 ~ handleEvents ~ event:', event);

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
          console.log('🚀 ~ activeSpaceRef.current:', activeSpaceRef.current);
          if (payload.spaceId !== activeSpaceRef.current?.id) return;

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

  // handle tab drag
  // handle tabs drag end
  const onTabsDragEnd: OnDragEndResponder = result => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) return;

    const droppedSpaceId = result.destination.droppableId;
    const reOrderedTabs = [...activeSpace.tabs];
    const [tabToMove] = reOrderedTabs.splice(result.source.index, 1);

    const activeTab = activeSpace?.tabs[activeSpace.activeTabIndex];
    // check if dropped space is active space
    if (droppedSpaceId === activeSpace?.id) {
      // if yes, then re-arrange tabs and update active tab index

      reOrderedTabs.splice(result.destination.index, 0, tabToMove);
      (async () => {
        // move tab in window
        await chrome.tabs.move(tabToMove.id, { index: result.destination.index });
        // update storage
        await setTabsForSpace(activeSpace.id, reOrderedTabs);
      })();

      // save local ui state
      setActiveSpace({
        ...activeSpace,
        activeTabIndex: reOrderedTabs.findIndex(el => el.url === activeTab.url),
        tabs: reOrderedTabs,
      });
      return;
    }

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
  };

  return {
    nonActiveSpaces,
    setNonActiveSpaces,
    getAllSpacesStorage,
    handleEvents,
    onTabsDragEnd,
  };
};
