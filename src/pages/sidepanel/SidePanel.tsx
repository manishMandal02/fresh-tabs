import { useState, useEffect } from 'react';
import { ISpaceWithTabs } from '../types/global.types';
import { CreateSpace, Space, UpdateSpace } from './components/space';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import Snackbar from './components/snackbar';
import { useAtom } from 'jotai';
import { snackbarAtom } from '@root/src/stores/app';

const SidePanel = () => {
  const [spaces, setSpaces] = useState<ISpaceWithTabs[] | undefined>(undefined);

  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpaceWithTabs | undefined>(undefined);

  const [activeSpaceId, setActiveSpaceId] = useState('');

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

    // set to storage
    setSpaces(spacesWithTabs);
  };

  // set the active space based on current window
  const getActiveSpace = async () => {
    const windowId = await getCurrentWindowId();
    const activeSpace = spaces.find(space => space.windowId === windowId);

    setActiveSpaceId(activeSpace.id);
  };

  useEffect(() => {
    (async () => {
      // get all spaces and it's tabs
      await getAllSpacesFromStorage();
      // set active space
      await getActiveSpace();
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
