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
import { MdAdd, MdOutlineSync } from 'react-icons/md';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';
import Tooltip from './components/elements/tooltip';
import { getGlobalPinnedTabs } from '@root/src/services/chrome-storage/tabs';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
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

  //  loading spaces state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  //  global pinned tabs
  const [globalPinnedTabs, setGlobalPinnedTabs] = useState<IPinnedTab[]>([]);

  // add new space modal
  const [showAddSpaceModal, setShowAddSpaceModal] = useState(false);

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

    isDraggingGlobal,
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
        <div className="w-full h-[84%]   px-3 py-1  scroll-p-px scroll-m-px relative">
          {/* un saved  */}
          {isLoadingSpaces ? (
            <Spinner size="md" />
          ) : (
            <DragDropContext onDragEnd={onTabsDragEnd} onBeforeDragStart={onTabsDragStart}>
              z{/* Current space */}
              <div className="h-[86%]">
                <ActiveSpace
                  space={activeSpace}
                  tabs={activeSpaceTabs}
                  setActiveSpace={setActiveSpace}
                  isDraggingGlobal={isDraggingGlobal}
                />
              </div>
              {/* other spaces */}
              <div className="w-full h-[12%] -mt-3.5 flex items-start overflow-hidden  mx-auto ">
                <Droppable droppableId="other-spaces" direction="horizontal" isDropDisabled={isDraggingGlobal}>
                  {(provided1, { isDraggingOver: isDraggingOverOtherSpaces }) => (
                    <div
                      {...provided1.droppableProps}
                      ref={provided1.innerRef}
                      className="w-[80%]  pb-2 px-1 flex  gap-x-2 overflow-y-hidden overflow-x-auto scroll-smooth  cc-scrollbar shadow-inner shadow-brand-darkBgAccent/30">
                      {[...nonActiveSpaces].map((space, idx) => {
                        return (
                          <Draggable
                            key={space.id}
                            draggableId={space.id}
                            index={idx}
                            isDragDisabled={isDraggingGlobal}>
                            {provided3 => (
                              <div
                                ref={provided3.innerRef}
                                {...provided3.draggableProps}
                                {...provided3.dragHandleProps}>
                                <Droppable
                                  key={space.id}
                                  droppableId={space.id}
                                  direction="horizontal"
                                  isDropDisabled={isDraggingOverOtherSpaces}
                                  isCombineEnabled>
                                  {(provided2, { isDraggingOver }) => (
                                    <div
                                      {...provided2.droppableProps}
                                      ref={provided2.innerRef}
                                      className=" h-fit w-[50px] ">
                                      <NonActiveSpace space={space} isDraggedOver={isDraggingOver} />
                                    </div>
                                  )}
                                </Droppable>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                    </div>
                  )}
                </Droppable>

                {/* Add new space button */}
                <div className="w-[14%] py-1 ml-1 h-fit">
                  <Droppable droppableId={'add-new-space'} direction="horizontal" mode="standard">
                    {(provided, { isDraggingOver }) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className=" z-10">
                        <Tooltip label="Add new space" delay={1500}>
                          <button
                            className="bg-gradient-to-bl from-brand-darkBgAccent/90 w-[38px] h-[38px] to-brand-darkBg/90 cursor-pointer flex items-center justify-center  rounded"
                            style={{
                              border: isDraggingOver ? '1px dashed #6b6a6a' : '',
                              backgroundColor: isDraggingOver ? ' #21262e' : '',
                            }}
                            onClick={() => setShowAddSpaceModal(true)}>
                            <MdAdd className="text-2xl font-extralight  text-slate-600" />
                          </button>
                        </Tooltip>
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            </DragDropContext>
          )}
          {/* add new space */}
          <CreateSpace show={showAddSpaceModal} onClose={() => setShowAddSpaceModal(false)} />
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
