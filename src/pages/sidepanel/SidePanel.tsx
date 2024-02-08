import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { MdOutlineSync } from 'react-icons/md';
import { useState, useEffect, useRef } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import Search from './components/search';
import { FavTabs } from './components/space/tab';
import Tooltip from './components/elements/tooltip';
import { useSidePanel } from './hooks/useSidePanel';
import Spinner from './components/elements/spinner';
import Snackbar from './components/elements/snackbar';
import { appSettingsAtom, snackbarAtom } from '@root/src/stores/app';
import { IMessageEventSidePanel, IPinnedTab, ITab } from '../types/global.types';
import DeleteSpaceModal from './components/space/delete/DeleteSpaceModal';
import { ActiveSpace, CreateSpace, UpdateSpace } from './components/space';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import { getGlobalPinnedTabs } from '@root/src/services/chrome-storage/tabs';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';
import OtherSpacesContainer from './components/space/other-space/OtherSpacesContainer';
import Settings from './components/settings/Settings';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // global state - snackbar
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // global state - app settings
  const [, setAppSetting] = useAtom(appSettingsAtom);

  // local state - clone of active space tabs (to manipulate multi drag behavior)
  const [activeSpaceTabs, setActiveSpaceTabs] = useState<ITab[]>(null);

  //  loading spaces state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  //  global pinned tabs
  const [globalPinnedTabs, setGlobalPinnedTabs] = useState<IPinnedTab[]>([]);

  // logics hook
  const {
    activeSpace,
    setActiveSpace,
    setNonActiveSpaces,
    getAllSpacesStorage,
    handleEvents,
    onTabsDragEnd,
    onTabsDragStart,
    isDraggingTabs,
    isDraggingSpace,
  } = useSidePanel(setActiveSpaceTabs);

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
    const event = msg as IMessageEventSidePanel;

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

    await handleEvents(msg as IMessageEventSidePanel, activeSpaceRef);

    response(true);
  });

  // sync/save spaces to bookmarks
  const handleSaveSpacesToBM = async () => {
    setIsLoadingSaveSpaces(true);

    await syncSpacesToBookmark();

    setIsLoadingSaveSpaces(false);

    setSnackbar({ show: true, isSuccess: true, msg: 'Saved spaces to bookmarks' });
  };

  // animation for other spaces drop zone
  const animationVariants = {
    visible: { scale: 1, opacity: 1 },
    hidden: { scale: 0, opacity: 0 },
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
        <div className="w-full h-[84%] px-3 py-1 scroll-p-px scroll-m-px relative">
          {/* un saved  */}
          {isLoadingSpaces ? (
            <Spinner size="md" />
          ) : (
            <DragDropContext onDragEnd={onTabsDragEnd} onBeforeDragStart={onTabsDragStart}>
              {/* Current space */}
              <div className="h-[82%] relative mb-5">
                <ActiveSpace
                  space={activeSpace}
                  tabs={activeSpaceTabs}
                  setActiveSpace={setActiveSpace}
                  isDraggingGlobal={isDraggingTabs}
                />

                {/* dropzone for other space to open tabs in active space */}

                <Droppable droppableId="open-non-active-space-tabs" type="SPACE">
                  {(provided2, { isDraggingOver }) => (
                    <div
                      ref={provided2.innerRef}
                      className="max-h-[90%] w-full absolute top-0 mt-8 left-0 rounded-lg transition-all duration-300 ease-in-out"
                      style={{
                        border: isDraggingOver ? '2px solid #05957f' : '#082545',
                        height: `${activeSpace?.tabs?.length * 1.9}rem`,
                        visibility: isDraggingSpace ? 'visible' : 'hidden',
                        zIndex: isDraggingSpace ? 200 : 1,
                      }}>
                      <motion.div
                        animate={isDraggingSpace ? 'visible' : 'hidden'}
                        variants={animationVariants}
                        transition={{ type: 'spring', stiffness: 900, damping: 40, duration: 0.2 }}
                        style={{
                          visibility: isDraggingSpace ? 'visible' : 'hidden',
                          zIndex: isDraggingSpace ? 200 : 1,
                        }}
                        className="h-full w-full bg-gradient-to-tr from-brand-darkBgAccent/40
                              z-[100] to-slate-800/40 flex items-center justify-center rounded-lg">
                        <p
                          className="text-slate-200 text-xs font-light  bg-gradient-to-bl from-brand-darkBgAccent
                              z-[100] to-slate-900 px-4 py-2 rounded-md ">
                          {isDraggingOver ? 'Open tabs in this space' : "Drop space to open it's tabs"}
                        </p>
                      </motion.div>
                    </div>
                  )}
                </Droppable>
              </div>
              {/* other spaces */}
              <div className="h-[18%]">
                <OtherSpacesContainer isDraggingTabs={isDraggingTabs} isDraggingSpace={isDraggingSpace} />
              </div>
            </DragDropContext>
          )}

          {/* add new space */}
          <CreateSpace />
        </div>

        {/* Edit/view space modal */}
        <UpdateSpace />

        {/* delete space alert modal */}
        <DeleteSpaceModal />

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
