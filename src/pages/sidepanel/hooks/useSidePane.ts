import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { IMessageEvent, ISpaceWithTabs } from '../../types/global.types';
import { logger } from '../../utils/logger';
import { useAtom } from 'jotai';
import { spacesAtom } from '@root/src/stores/app';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { useEffect } from 'react';

export const useSidePanel = () => {
  // spaces atom (global state)
  const [spaces, setSpaces] = useAtom(spacesAtom);

  // get all spaces from storage
  const getAllSpacesStorage = async () => {
    // get all the spaces
    const allSpaces = await getAllSpaces();

    // get tabs for each  space
    const spacesWithTabs: ISpaceWithTabs[] = [];

    for (const space of allSpaces) {
      const tabs = await getTabsInSpace(space.id);
      spacesWithTabs.push({
        tabs,
        ...space,
      });
    }

    return spacesWithTabs;
  };

  useEffect(() => {
    (async () => {
      const allSpaces = await getAllSpacesStorage();
      setSpaces(allSpaces);
    })();
  }, []);

  // set the active space based on current window
  const getActiveSpaceId = async () => {
    const windowId = await getCurrentWindowId();

    console.log('🚀 ~ file: useSidePane.ts:36 ~ getActiveSpaceId ~ windowId:', windowId);

    const activeSpace = spaces?.find(space => space?.windowId === windowId);

    console.log('🚀 ~ file: useSidePane.ts:40 ~ getActiveSpaceId ~ spaces:', spaces);

    console.log('🚀 ~ file: useSidePane.ts:40 ~ getActiveSpaceId ~ activeSpace:', activeSpace);

    return activeSpace?.id;
  };

  // handle background events
  const handleEvents = async ({ event, payload }: IMessageEvent) => {
    switch (event) {
      case 'ADD_SPACE': {
        // add new space
        setSpaces(prev => [...prev, payload.space as ISpaceWithTabs]);
        break;
      }

      case 'REMOVE_SPACE': {
        // remove space
        setSpaces(prev => [...prev.filter(s => s.id !== payload.spaceId)]);
        break;
      }

      case 'UPDATE_SPACE_ACTIVE_TAB': {
        setSpaces(prev => [
          ...prev.map(s => {
            if (s.id !== payload.spaceId) return s;

            // update active tab index for the space
            s.activeTabIndex = payload.newActiveIndex;
            return s;
          }),
        ]);

        break;
      }

      case 'UPDATE_TABS': {
        // get updated tabs from storage
        const updatedTabs = await getTabsInSpace(payload.spaceId);
        setSpaces(prev => [
          ...prev.map(s => {
            // replace tabs for  space
            if (s.id === payload.spaceId) s.tabs = updatedTabs;

            return s;
          }),
        ]);
        break;
      }

      default: {
        logger.info(`Unknown event: ${event} `);
      }
    }
  };

  return {
    spaces,
    getActiveSpaceId,
    handleEvents,
    getAllSpacesStorage,
  };
};
