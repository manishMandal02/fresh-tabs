import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { useAtom } from 'jotai';
import { spacesAtom } from '@root/src/stores/app';
import { getAllSpaces, getSpaceByWindow } from '@root/src/services/chrome-storage/spaces';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';

export const useSidePanel = () => {
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

  return {
    nonActiveSpaces,
    setNonActiveSpaces,
    getAllSpacesStorage,
  };
};
