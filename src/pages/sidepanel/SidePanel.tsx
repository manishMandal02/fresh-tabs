import { useState, useEffect } from 'react';
import { ISpaceWithTabs } from '../types/global.types';
import { CreateSpace, Space, UpdateSpace } from './components/space';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';
import Snackbar from './components/snackbar';
import { useAtom } from 'jotai';
import { snackbarAtom, spacesAtom } from '@root/src/stores/app';
import Spinner from './components/spinner';

const SidePanel = () => {
  // spaces atom (global state)
  const [spaces, setSpaces] = useAtom(spacesAtom);

  // space opened for update
  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpaceWithTabs | undefined>(undefined);

  // active space in the window
  const [activeSpaceId, setActiveSpaceId] = useState('');

  // expanded space
  const [expandedSpaceId, setExpandedSpaceId] = useState('');

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

  // refetch space info
  // const reFetchSpace = (spaceId: string) => {
  //   // get all tabs for space
  //   const tabs = await getTabsInSpace(spaceId);
  // };

  // set the active space based on current window
  const getActiveSpace = async (spacesInStorage: ISpaceWithTabs[]) => {
    const windowId = await getCurrentWindowId();

    const activeSpace = spacesInStorage?.find(space => space?.windowId === windowId);

    setActiveSpaceId(activeSpace.id);
  };
  // listen to events from  background
  chrome.runtime.onMessage.addListener((msg, _sender, response) => {
    console.log('🚀 ~ file: SidePanel.tsx:59 ~ chrome.runtime.onMessage.addListener ~ msg:', msg);
    response(true);
  });

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
              {/* unsaved spaces, sort based on title */}
              {spaces
                ?.sort((a, b) => (a.title > b.title ? 1 : -1))
                .map(({ tabs, ...space }) =>
                  !space.isSaved ? (
                    <Space
                      key={space.id}
                      numSpaces={spaces.length}
                      space={space}
                      tabs={tabs}
                      isActive={activeSpaceId === space.id}
                      isExpanded={expandedSpaceId === space.id}
                      onExpand={() => setExpandedSpaceId(prevId => (prevId !== space.id ? space.id : ''))}
                      onUpdateClick={() => setSpaceToUpdate({ ...space, tabs })}
                    />
                  ) : null,
                )}
              <>
                <hr className="h-px bg-slate-700/30 border-none rounded-md w-[60%] mt-0 mb-2 mx-auto" />
              </>
              {/* saved spaces */}
              {spaces?.map(({ tabs, ...space }) =>
                space.isSaved ? (
                  <Space
                    key={space.id}
                    numSpaces={spaces.length}
                    space={space}
                    tabs={tabs}
                    isActive={activeSpaceId === space.id}
                    isExpanded={expandedSpaceId === space.id}
                    onExpand={() => setExpandedSpaceId(prevId => (prevId !== space.id ? space.id : ''))}
                    onUpdateClick={() => setSpaceToUpdate({ ...space, tabs })}
                  />
                ) : null,
              )}
            </>
          )}
          {/* add new space */}
          <CreateSpace />
          {/* update space */}
          <UpdateSpace space={spaceToUpdate} tabs={spaceToUpdate?.tabs} onClose={() => setSpaceToUpdate(undefined)} />
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
