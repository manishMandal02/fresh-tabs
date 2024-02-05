import { useState, useEffect, useRef } from 'react';
import { IMessageEvent, IPinnedTab, ITab } from '../types/global.types';
import { ActiveSpace, CreateSpace } from './components/space';
import Snackbar from './components/elements/snackbar';
import { useAtom } from 'jotai';
import { appSettingsAtom, snackbarAtom } from '@root/src/stores/app';
import Spinner from './components/elements/spinner';
import { useSidePanel } from './hooks/useSidePanel';
import Settings from './components/settings/Settings';
import Search from './components/search';
import { MdOutlineSync } from 'react-icons/md';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';
import Tooltip from './components/elements/tooltip';
import { getGlobalPinnedTabs } from '@root/src/services/chrome-storage/tabs';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import { FavTabs } from './components/space/tab';
import OtherSpacesContainer from './components/space/other-space/OtherSpacesContainer';
import DeleteSpaceModal from './components/space/delete/DeleteSpaceModal';
import { motion } from 'framer-motion';

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
    nonActiveSpaces,
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
              z{/* Current space */}
              <div className="h-[82%] relative">
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
                      className="w-full h-full absolute top-0 mt-8 left-0 rounded-lg z-[99]"
                      style={{
                        border: isDraggingOver ? '2px solid #05957f' : '',
                        height: activeSpace?.tabs.length * 1.9 + 'rem',
                      }}>
                      <motion.div
                        animate={isDraggingSpace ? 'visible' : 'hidden'}
                        variants={animationVariants}
                        transition={{ type: 'spring', stiffness: 900, damping: 40, duration: 0.2 }}
                        className="h-full w-full bg-gradient-to-tr from-brand-darkBgAccent/30
                              z-[100] to-slate-800/30 flex items-center justify-center rounded-lg">
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
                <OtherSpacesContainer
                  spaces={nonActiveSpaces}
                  isDraggingTabs={isDraggingTabs}
                  isDraggingSpace={isDraggingSpace}
                />
              </div>
            </DragDropContext>
          )}

          {/* add new space */}
          <CreateSpace />
        </div>

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
