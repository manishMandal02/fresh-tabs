import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';

import Footer from './components/features/footer';
import { useSidePanel } from './hooks/useSidePanel';
import Spinner from './components/elements/spinner';
import Snackbar from './components/elements/snackbar';
import CommandPalette from '../content/command-palette';
import Settings from './components/features/settings/Settings';
import { IMessageEventSidePanel } from '../types/global.types';
import Notification from './components/features/notification/Notification';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import DeleteSpaceModal from './components/features/space/delete/DeleteSpaceModal';
import { ActiveSpace, CreateSpace, UpdateSpace } from './components/features/space';
import { appSettingsAtom, dragStateAtom, snackbarAtom } from '@root/src/stores/app';
import { TAB_HEIGHT } from './components/features/space/active-space/ActiveSpaceTabs';
import UserAccount from './components/features/user/UserAccount';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // global state - snackbar
  const [snackbar] = useAtom(snackbarAtom);

  // dragging state
  const [{ isDragging: isDraggingGlobal, type: draggingType }] = useAtom(dragStateAtom);

  // global state - app settings
  const [, setAppSetting] = useAtom(appSettingsAtom);

  //  loading spaces state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // show command palette
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  //  global pinned tabs
  // const [globalPinnedTabs, setGlobalPinnedTabs] = useState<IPinnedTab[]>([]);

  // logics hook
  const {
    activeSpace,
    setActiveSpace,
    setNonActiveSpaces,
    getAllSpacesStorage,
    handleEvents,
    onTabsDragEnd,
    onTabsDragStart,
  } = useSidePanel();

  const activeSpaceRef = useRef(activeSpace);

  // init component
  useEffect(() => {
    (async () => {
      setIsLoadingSpaces(true);

      const { activeSpaceWithTabs, otherSpaces } = await getAllSpacesStorage();

      setActiveSpace({ ...activeSpaceWithTabs });

      setNonActiveSpaces(otherSpaces);
      // set app settings
      const settings = await getAppSettings();

      setAppSetting(settings);
      // const pinnedTabs = await getGlobalPinnedTabs();
      // setGlobalPinnedTabs(pinnedTabs);
      setIsLoadingSpaces(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    activeSpaceRef.current = activeSpace;
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

  // animation for other spaces drop zone
  const animationVariants = {
    visible: { scale: 1, opacity: 1 },
    hidden: { scale: 0, opacity: 0 },
  };

  const handleShowCommandPalette = useCallback(() => {
    setShowCommandPalette(true);
  }, []);

  return (
    <main className="w-screen h-screen overflow-hidden bg-brand-darkBg">
      {/* <p className="text-sm font-light text-slate-400 mt-3 mb-1 ml-3 select-none">Spaces</p> */}
      {/* global */}
      {/* <div className="mt-4">
          <FavTabs tabs={globalPinnedTabs} isGlobal={true} setGlobalPinnedTabs={setGlobalPinnedTabs} />
        </div> */}

      {/* dnd container */}
      <div className="!size-full !h-screen -mt-4 ">
        {/* un saved  */}
        {isLoadingSpaces ? (
          <Spinner size="md" />
        ) : (
          <DragDropContext onDragEnd={onTabsDragEnd} onBeforeDragStart={onTabsDragStart}>
            {/* Current space */}
            <div className="h-[95%] relative px-1.5">
              <ActiveSpace
                space={activeSpace}
                setActiveSpace={setActiveSpace}
                onSearchClick={handleShowCommandPalette}
              />

              {/* dropzone for other space to open tabs in active space */}
              <Droppable droppableId="open-non-active-space-tabs" type="SPACE">
                {(provided2, { isDraggingOver }) => (
                  <div
                    ref={provided2.innerRef}
                    className="flex-grow w-full absolute top-[70px] left-0 rounded-lg transition-all duration-300 ease-in-out"
                    style={{
                      border: isDraggingOver ? '2px solid #05957f' : '#082545',
                      height: `${activeSpace?.tabs?.length * (TAB_HEIGHT * 1.15)}px`,
                      visibility: isDraggingGlobal && draggingType === 'space' ? 'visible' : 'hidden',
                      zIndex: isDraggingGlobal && draggingType === 'space' ? 200 : 1,
                    }}>
                    <motion.div
                      animate={isDraggingGlobal && draggingType === 'space' ? 'visible' : 'hidden'}
                      variants={animationVariants}
                      transition={{ type: 'spring', stiffness: 900, damping: 40, duration: 0.2 }}
                      style={{
                        visibility: isDraggingGlobal && draggingType === 'space' ? 'visible' : 'hidden',
                        zIndex: isDraggingGlobal && draggingType === 'space' ? 200 : 1,
                      }}
                      className="h-full w-full bg-gradient-to-tr from-brand-darkBgAccent/20
                              z-[100] to-slate-800/30 flex items-center justify-center rounded-lg">
                      <p
                        className="text-slate-300 text-[13px] font-light bg-gradient-to-bl shadow shadow-brand-darkBgAccent/80 from-brand-darkBgAccent/90
                          to-brand-darkBg/90 px-4 z-[100] py-2.5 rounded-md">
                        {isDraggingOver ? 'Open tabs in this space' : 'Drop to open space tabs here'}
                      </p>
                    </motion.div>
                  </div>
                )}
              </Droppable>
            </div>
            <Footer
              isDraggingSpace={isDraggingGlobal && draggingType === 'space'}
              isDraggingTabs={isDraggingGlobal && draggingType === 'tabs'}
            />
          </DragDropContext>
        )}
      </div>
      {/* add new space */}
      <CreateSpace />

      {/* Edit/view space modal */}
      <UpdateSpace />

      {/* delete space alert modal */}
      <DeleteSpaceModal />

      {/* settings modal */}
      <Settings />

      {/* notification modal */}
      <Notification />

      {/* user account modal */}
      <UserAccount />

      {/* snackbar */}
      <Snackbar show={snackbar.show} msg={snackbar.msg} isSuccess={snackbar.isSuccess} isLoading={snackbar.isLoading} />
      {/* command palette */}
      {showCommandPalette ? (
        <div className="z-[99999]">
          <CommandPalette
            isSidePanel
            activeSpace={activeSpace}
            recentSites={[]}
            onClose={() => setShowCommandPalette(false)}
          />
        </div>
      ) : null}
    </main>
  );
};

export default SidePanel;
