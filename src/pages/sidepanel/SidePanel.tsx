import { useState, useEffect } from 'react';
import { ISpaceWithTabs } from '../types/global.types';
import { CreateSpace, Space, UpdateSpace } from './components/space';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import Snackbar from './components/snackbar';
import { useAtom } from 'jotai';
import { snackbarAtom } from '@root/src/stores/app';
import Spinner from './components/spinner';

const SidePanel = () => {
  // all spaces
  const [spaces, setSpaces] = useState<ISpaceWithTabs[] | undefined>(undefined);

  // space opened for update
  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpaceWithTabs | undefined>(undefined);

  // active space in the window
  const [activeSpaceId, setActiveSpaceId] = useState('');

  // loading space state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // snackbar global state/atom
  const [snackbar] = useAtom(snackbarAtom);

  // get all spaces and
  const getAllSpacesFromStorage = async () => {
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
    console.log('🚀 ~ file: SidePanel.tsx:36 ~ getAllSpacesFromStorage ~ spacesWithTabs:', spacesWithTabs);

    return spacesWithTabs;
  };

  // set the active space based on current window
  const getActiveSpace = async (spacesInStorage: ISpaceWithTabs[]) => {
    const windowId = await getCurrentWindowId();

    const activeSpace = spacesInStorage?.find(space => space?.windowId === windowId);

    setActiveSpaceId(activeSpace.id);
  };

  // get all spaces from storage on load
  useEffect(() => {
    (async () => {
      setIsLoadingSpaces(true);
      // get all spaces and it's tabs
      const spacesInStorage = await getAllSpacesFromStorage();
      // set active space
      await getActiveSpace(spacesInStorage);

      // set to storage
      setSpaces(spacesInStorage);

      setIsLoadingSpaces(false);
    })();
  }, []);

  return (
    <div className="w-screen h-screen  overflow-hidden bg-brand-background">
      <main className="h-full relative ">
        {/* heading */}
        <p className="h-[3%] text-slate-300 text-[.9rem] font-extralight pt-1  text-center">Fresh Tabs</p>
        {/* spaces */}
        <div className="w-full  h-[97%] pt-10 px-3">
          <p className="text-sm text-slate-500  mb-1.5 tracking-wide select-none">Spaces</p>
          {/* un saved  */}
          {isLoadingSpaces ? (
            <Spinner size="md" />
          ) : (
            <>
              {spaces?.map(space => (
                <Space
                  key={space.id}
                  numSpaces={spaces.length}
                  space={space}
                  tabs={space.tabs}
                  onUpdateClick={() => setSpaceToUpdate(space)}
                  isActive={activeSpaceId === space.id}
                />
              ))}
            </>
          )}
          {/* add new space */}
          <CreateSpace />
          {/* update space */}
          <UpdateSpace
            space={spaceToUpdate}
            numTabs={spaceToUpdate?.tabs.length}
            onClose={() => setSpaceToUpdate(undefined)}
          />
        </div>

        {/* snackbar */}
        <Snackbar
          show={snackbar.show}
          msg={snackbar.msg}
          isSuccess={snackbar.isSuccess}
          isLoading={snackbar.isLoading}
        />
      </main>
    </div>
  );
};

export default SidePanel;
