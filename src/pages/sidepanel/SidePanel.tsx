import { Geiger } from 'react-geiger';
import { motion } from 'framer-motion';
import { useAtom, useSetAtom } from 'jotai';
import { ErrorBoundary } from 'react-error-boundary';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { useState, useEffect, useCallback, useRef } from 'react';

import { isChromeUrl } from '@root/src/utils';
import Spinner from '../../components/spinner';
import Snackbar from '../../components/snackbar';
import Footer from './components/features/footer';
import Auth from './components/features/user/auth';
import { useSidePanel } from './hooks/useSidePanel';
import Settings from './components/features/settings/Settings';
import { showCommandPaletteContentScript } from '../background';
import UserAccount from './components/features/user/UserAccount';
import { IMessageEventSidePanel } from '../../types/global.types';
import { getCurrentTab } from '@root/src/services/chrome-tabs/tabs';
import { SnoozedTabs } from './components/features/space/active-space';
import { getAllNotes } from '@root/src/services/chrome-storage/notes';
import Notification from './components/features/notification/Notification';
import SpaceHistory from './components/features/space/history/SpaceHistory';
import AddNewNote from './components/features/notes/notes-modal/NotesModal';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import ErrorBoundaryUI from '../../components/error-boundary/ErrorBoundaryUI';
import DeleteSpaceModal from './components/features/space/delete/DeleteSpaceModal';
import { ActiveSpace, CreateSpace, UpdateSpace } from './components/features/space';
import { TAB_HEIGHT } from './components/features/space/active-space/ActiveSpaceTabs';
import { getAllNotifications } from '@root/src/services/chrome-storage/user-notifications';
import {
  appSettingsAtom,
  dragStateAtom,
  userNotificationsAtom,
  setActiveSpaceAtom,
  setSpacesAtom,
  showNotificationModalAtom,
  notesAtom,
  userAtom,
} from '@root/src/stores/app';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // global state
  // dragging state
  const [{ isDragging: isDraggingGlobal, type: draggingType }] = useAtom(dragStateAtom);

  // global state - app settings
  const [user, setUser] = useAtom(userAtom);
  const setAppSetting = useSetAtom(appSettingsAtom);
  const setUserNotifications = useSetAtom(userNotificationsAtom);
  const setNotes = useSetAtom(notesAtom);

  const setSpaces = useSetAtom(setSpacesAtom);

  const setActiveSpaceId = useSetAtom(setActiveSpaceAtom);

  //  notification modal atom
  const [, setShowNotification] = useAtom(showNotificationModalAtom);

  //  loading spaces state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  //  global pinned tabs
  // const [globalPinnedTabs, setGlobalPinnedTabs] = useState<IPinnedTab[]>([]);

  // logics hook
  const { activeSpace, activeSpaceTabs, getAllSpacesStorage, handleEvents, onTabsDragEnd, onTabsDragStart } =
    useSidePanel();

  const activeSpaceRef = useRef(activeSpace);

  // init component
  useEffect(() => {
    setIsLoadingSpaces(true);
    (async () => {
      // TODO - temp
      // check if user authed or not
      // const user = await getUser();

      // if (!user) return;

      // set user
      setUser(user);

      const { currentSpace, allSpaces } = await getAllSpacesStorage();

      setSpaces(allSpaces);

      setActiveSpaceId(currentSpace.id);

      // set app settings, notifications and notes data from storage
      const settings = await getAppSettings();

      const allNotes = await getAllNotes();

      const notifications = await getAllNotifications();

      setAppSetting(settings);
      setNotes(allNotes);
      setUserNotifications(notifications);
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

  const handleShowCommandPalette = useCallback(async () => {
    const currentTab = await getCurrentTab();

    const shouldOpenInPopupWindow = isChromeUrl(currentTab.url);

    await showCommandPaletteContentScript(currentTab.id, activeSpace?.windowId, shouldOpenInPopupWindow);
  }, [activeSpace]);

  const handleShowNotification = useCallback(() => {
    setShowNotification(true);
  }, [setShowNotification]);

  return (
    <Geiger>
      <main className="w-screen h-screen overflow-hidden bg-brand-darkBg">
        {/* <p className="text-sm font-light text-slate-400 mt-3 mb-1 ml-3 select-none">Spaces</p> */}
        {/* global */}
        {/* <div className="mt-4">
          <FavTabs tabs={globalPinnedTabs} isGlobal={true} setGlobalPinnedTabs={setGlobalPinnedTabs} />
        </div> */}
        <ErrorBoundary FallbackComponent={ErrorBoundaryUI}>
          {user ? (
            <Auth />
          ) : (
            <>
              {/* dnd container */}
              <div className="!size-full !h-screen -mt-4 ">
                {/* un saved  */}
                {isLoadingSpaces ? (
                  <Spinner size="md" />
                ) : (
                  <DragDropContext onDragEnd={onTabsDragEnd} onBeforeCapture={onTabsDragStart}>
                    {/* Current space */}
                    <div className="h-[95%] relative px-1.5 ">
                      <ActiveSpace
                        space={activeSpace}
                        onSearchClick={handleShowCommandPalette}
                        onNotificationClick={handleShowNotification}
                      />

                      {/* dropzone for other space to open tabs in active space */}
                      <Droppable droppableId="open-non-active-space-tabs" type="SPACE">
                        {(provided2, { isDraggingOver }) => (
                          <div
                            ref={provided2.innerRef}
                            className="flex-grow w-full absolute top-[70px] left-0 border-2 rounded-lg transition-all duration-300 ease-in-out "
                            style={{
                              borderColor: isDraggingOver ? '#05957f' : '#1e293b',
                              height: `${activeSpaceTabs?.length * (TAB_HEIGHT * 1.15)}px`,
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
                    <Footer isDraggingSpace={isDraggingGlobal && draggingType === 'space'} />
                  </DragDropContext>
                )}
              </div>

              {/* space history modal */}
              <SpaceHistory />
              {/* snoozed tabs modal */}
              <SnoozedTabs />

              {/* Edit/view space modal */}
              <UpdateSpace />

              {/* settings modal */}
              <Settings />

              {/* notification modal */}
              <Notification />

              {/* user account modal */}
              <UserAccount />

              {/* add new space */}
              <CreateSpace />

              {/* add new note */}
              <AddNewNote />

              {/* delete space alert modal */}
              <DeleteSpaceModal />

              {/* snackbar */}
              <Snackbar />
            </>
          )}
        </ErrorBoundary>
      </main>
    </Geiger>
  );
};

export default SidePanel;
