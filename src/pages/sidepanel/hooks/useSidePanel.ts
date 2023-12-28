import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { IMessageEvent, ISpaceWithTabs } from '../../types/global.types';
import { logger } from '../../utils/logger';
import { useAtom } from 'jotai';
import { spacesAtom } from '@root/src/stores/app';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { useEffect } from 'react';
import type { OnDragEndResponder } from 'react-beautiful-dnd';
import { setStorage } from '@root/src/services/chrome-storage/helpers';

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
    // eslint-disable-next-line
  }, []);

  // handle drag spaces
  const onDragEnd: OnDragEndResponder = result => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) return;

    const updatedSpaces = [...spaces];

    const [removed] = updatedSpaces.splice(result.source.index, 1);
    updatedSpaces.splice(result.destination.index, 0, removed);
    setSpaces(updatedSpaces);

    // save the new order of spaces
    (async () => {
      await setStorage({
        type: 'sync',
        key: 'SPACES',
        value: [
          ...updatedSpaces.map(space => {
            // eslint-disable-next-line
            const { tabs, ...spaceWithoutTabs } = space;
            return spaceWithoutTabs;
          }),
        ],
      });
    })();
  };

  // set the active space based on current window
  const getActiveSpaceId = async () => {
    const windowId = await getCurrentWindowId();

    const activeSpace = spaces?.find(space => space?.windowId === windowId);

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
    onDragEnd,
  };
};
