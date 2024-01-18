import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { IMessageEvent, ISpaceWithTabs } from '../../types/global.types';
import { logger } from '../../utils/logger';
import { useAtom } from 'jotai';
import { spacesAtom } from '@root/src/stores/app';
import { getAllSpaces, getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { useState } from 'react';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';

export const useSidePanel = () => {
  // spaces atom (global state)
  const [nonActiveSpaces, setNonActiveSpaces] = useAtom(spacesAtom);

  // local state
  const [activeSpace, setActiveSpace] = useState<ISpaceWithTabs | undefined>(undefined);

  // get all spaces from storage
  const getAllOtherSpaces = async () => {
    // get all the spaces
    const allSpaces = await getAllSpaces();

    const windowId = await getCurrentWindowId();

    // get currentSpace
    const currentSpace = await getSpaceByWindow(windowId);

    const tabsFroCurrentSpace = await getTabsInSpace(currentSpace?.id);

    setActiveSpace({ ...currentSpace, tabs: tabsFroCurrentSpace });

    return [...allSpaces.filter(s => s.id !== currentSpace?.id)];
  };

  // handle background events
  const handleEvents = async ({ event, payload }: IMessageEvent) => {
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
        if (payload.spaceId !== activeSpace?.id) return;
        setActiveSpace(prev => ({ ...prev, activeTabIndex: payload.newActiveIndex }));

        break;
      }

      case 'UPDATE_TABS': {
        // get updated tabs from storage
        if (payload.spaceId !== activeSpace?.id) return;
        const updatedTabs = await getTabsInSpace(payload.spaceId);
        setActiveSpace(prev => ({ ...prev, tabs: updatedTabs }));
        break;
      }

      default: {
        logger.info(`Unknown event: ${event} `);
      }
    }
  };

  return {
    nonActiveSpaces,
    setNonActiveSpaces,
    handleEvents,
    getAllOtherSpaces,
    activeSpace,
    setActiveSpace,
  };
};
