import { useState, useEffect } from 'react';
import { IMessageEvent, ISpaceWithTabs } from '../types/global.types';
import { CreateSpace, Space, UpdateSpace } from './components/space';
import Snackbar from './components/snackbar';
import { useAtom } from 'jotai';
import { snackbarAtom } from '@root/src/stores/app';
import Spinner from './components/spinner';
import { useSidePanel } from './hooks/useSidePane';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // space opened for update
  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpaceWithTabs | undefined>(undefined);

  // custom hook
  const { spaces, setSpaces, getAllSpacesStorage, getActiveSpaceId, handleEvents } = useSidePanel();

  // active space in the window
  const [activeSpaceId, setActiveSpaceId] = useState('');

  // expanded space
  const [expandedSpaceId, setExpandedSpaceId] = useState('');

  // loading space state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // snackbar global state/atom
  const [snackbar] = useAtom(snackbarAtom);

  // listen to events from  background
  chrome.runtime.onMessage.addListener(async (msg, _sender, response) => {
    const event = msg as IMessageEvent;

    if (!event?.id) {
      response(true);
      return;
    }

    // handle idempotence
    // same events were  being consumed multiple times,
    // so we now have an id for each event to handle duplicate events

    // check if event was processed already
    // if yes, do nothing

    console.log('🚀 ~ file: SidePanel.tsx:49 ~ chrome.runtime.onMessage.addListener ~ event:', event);
    console.log(
      '🚀 ~ file: SidePanel.tsx:52 ~ chrome.runtime.onMessage.addListener ~ processedEvents.indexOf(event.id) !== -1:',
      processedEvents.indexOf(event.id) !== -1,
    );

    console.log(
      '🚀 ~ file: SidePanel.tsx:53 ~ chrome.runtime.onMessage.addListener ~ processedEvents:',
      processedEvents,
    );
    if (processedEvents.indexOf(event.id) !== -1) {
      response(true);
      return;
    }

    processedEvents.push(event.id);

    // handle events
    await handleEvents(msg as IMessageEvent);

    // add to processed events

    response(true);
  });

  // get all spaces from storage on load
  useEffect(() => {
    (async () => {
      setIsLoadingSpaces(true);
      // get all spaces and it's tabs
      const spacesInStorage = await getAllSpacesStorage();
      // get active space
      const spaceId = await getActiveSpaceId();

      // set to storage
      setSpaces(spacesInStorage);
      setActiveSpaceId(spaceId);

      setIsLoadingSpaces(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
