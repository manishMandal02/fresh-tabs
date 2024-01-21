import { useState, useEffect, useRef } from 'react';
import { IMessageEvent, IPinnedTab, ISpace, ITab } from '../types/global.types';
import { ActiveSpace } from './components/space';
import Snackbar from './components/elements/snackbar';
import { useAtom } from 'jotai';
import { appSettingsAtom, snackbarAtom } from '@root/src/stores/app';
import Spinner from './components/elements/spinner';
import { useSidePanel } from './hooks/useSidePanel';
import Settings from './components/settings/Settings';
import Search from './components/search';
import { MdAdd, MdOutlineSync } from 'react-icons/md';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';
import Tooltip from './components/elements/tooltip';
import { getGlobalPinnedTabs } from '@root/src/services/chrome-storage/tabs';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import NonActiveSpace from './components/space/other-space/NonActiveSpace';
import { FavTabs } from './components/space/tab';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // global state - snackbar
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // global state - app settings
  const [, setAppSetting] = useAtom(appSettingsAtom);

  // local state - clone of active space tabs (to manipulate multi drag behavior)
  const [activeSpaceTabs, setActiveSpaceTabs] = useState<ITab[]>(null);

  // local state - loading spaces state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // local state - global pinned tabs
  const [globalPinnedTabs, setGlobalPinnedTabs] = useState<IPinnedTab[]>([]);

  // custom hook
  const {
    activeSpace,
    setActiveSpace,
    nonActiveSpaces,
    setNonActiveSpaces,
    getAllSpacesStorage,
    handleEvents,
    onTabsDragEnd,
    onTabsDragStart,
  } = useSidePanel();

  const activeSpaceRef = useRef(activeSpace);

  // loading state for save spaces to bookmarks
  const [isLoadingSaveSpaces, setIsLoadingSaveSpaces] = useState(false);
  useEffect(() => {
    (async () => {
      setIsLoadingSpaces(true);

      const { activeSpaceWithTabs, otherSpaces } = await getAllSpacesStorage();

      setActiveSpace({ ...activeSpaceWithTabs });

      setNonActiveSpaces(otherSpaces);
      // set app settings
      const settings = await getAppSettings();

      setAppSetting(settings);
      const pinnedTabs = await getGlobalPinnedTabs();
      setGlobalPinnedTabs(pinnedTabs);
      setIsLoadingSpaces(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    activeSpaceRef.current = activeSpace;
    setActiveSpaceTabs(activeSpace?.tabs);
  }, [activeSpace]);

  // listen to  events from  background
  chrome.runtime.onMessage.addListener(async (msg, _sender, response) => {
    const event = msg as IMessageEvent;

    if (!event?.id) {
      response(true);
      return;
    }

    // handle idempotence
    // same events were  being consumed multiple times, so we keep track of events processed
    if (processedEvents.indexOf(event.id) !== -1) {
      response(true);
      return;
    }

    // add to processed events
    processedEvents.push(event.id);

    await handleEvents(msg as IMessageEvent, activeSpaceRef);

    response(true);
  });

  // sync/save spaces to bookmarks
  const handleSaveSpacesToBM = async () => {
    setIsLoadingSaveSpaces(true);

    await syncSpacesToBookmark();

    setIsLoadingSaveSpaces(false);

    setSnackbar({ show: true, isSuccess: true, msg: 'Saved spaces to bookmarks' });
  };

  return (
    <div className="w-screen h-screen  overflow-hidden bg-brand-darkBg">
      <main className="h-full relative ">
        {/* app name */}
        <div className="h-[4%] pt-2.5 flex items-start justify-between px-3">
          <span className="invisible">Hide</span>
          <p className=" text-slate-400 text-base font-light tracking-wide  text-center">Fresh Tabs</p>
          {/* opens settings modal */}
          <div className="flex items-center gap-[3.5px]">
            <Tooltip label="Save spaces to bookmarks">
              <MdOutlineSync
                size={20}
                className={`text-slate-600 -mb-[1.5px] cursor-pointer ${isLoadingSaveSpaces ? 'animate-spin' : ''}`}
                onClick={handleSaveSpacesToBM}
              />
            </Tooltip>
            <Settings />
          </div>
        </div>

        {/* search */}
        <Search />

        {/* <p className="text-sm font-light text-slate-400 mt-3 mb-1 ml-3 select-none">Spaces</p> */}

        {/* global */}
        <div className="mt-4">
          <FavTabs tabs={globalPinnedTabs} isGlobal={true} setGlobalPinnedTabs={setGlobalPinnedTabs} />
        </div>

        {/* spaces container */}
        <div className="w-full h-[85%] bg-red-30 px-3 py-1  scroll-p-px scroll-m-px relative ">
          {/* un saved  */}
          {isLoadingSpaces ? (
            <Spinner size="md" />
          ) : (
            <DragDropContext onDragEnd={onTabsDragEnd} onDragStart={onTabsDragStart}>
              {/* Current space */}
              <div className="h-[85%]">
                <ActiveSpace space={activeSpace} tabs={activeSpaceTabs} setActiveSpace={setActiveSpace} />
              </div>

              {/* other spaces */}
              <div className=" h-[15%] mt-1.5 flex  gap-x-2 mx-auto w-fit">
                {[...nonActiveSpaces, { id: 'new-space' }].map(space => (
                  <Droppable key={space.id} droppableId={space.id}>
                    {(provided, snapshot) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="">
                        {space.id !== 'new-space' ? (
                          <NonActiveSpace space={space as ISpace} isDraggedOver={snapshot.isDraggingOver} />
                        ) : (
                          // new space zone
                          <div className="bg-brand-darkBgAccent/70 cursor-pointer flex items-center justify-center w-[50px] h-[50px] rounded">
                            <MdAdd className="text-2xl font-extralight  text-slate-600" />
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                ))}
              </div>
            </DragDropContext>
          )}
          {/* add new space */}
          {/* <CreateSpace /> */}
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
