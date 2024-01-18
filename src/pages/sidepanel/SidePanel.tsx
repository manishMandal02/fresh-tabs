import { useState, useEffect } from 'react';
import { IMessageEvent, IPinnedTab, ISpace, ISpaceWithTabs } from '../types/global.types';
import { ActiveSpace, UpdateSpace } from './components/space';
import Snackbar from './components/elements/snackbar';
import { useAtom } from 'jotai';
import { appSettingsAtom, snackbarAtom } from '@root/src/stores/app';
import Spinner from './components/elements/spinner';
import { useSidePanel } from './hooks/useSidePanel';
import Settings from './components/settings/Settings';
import { omitObjProps } from '../utils/omit-obj-props';
import Search from './components/search';
import { MdAdd, MdOutlineSync } from 'react-icons/md';
import { syncSpacesToBookmark } from '@root/src/services/chrome-bookmarks/bookmarks';
import Tooltip from './components/elements/tooltip';
import type { OnDragEndResponder } from 'react-beautiful-dnd';
import { getGlobalPinnedTabs, getTabsInSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { DragDropContext, Droppable } from 'react-beautiful-dnd';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import NonActiveSpace from './components/space/other-space/NonActiveSpace';
import { FavTabs } from './components/space/tab';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // space opened for update
  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpaceWithTabs | undefined>(undefined);

  // custom hook
  const { nonActiveSpaces, setNonActiveSpaces, activeSpace, setActiveSpace, handleEvents, getAllOtherSpaces } =
    useSidePanel();

  // snackbar global state/atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // app settings atom (global state)
  const [, setAppSetting] = useAtom(appSettingsAtom);

  // local state - loading space state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // local state - global pinned tabs
  const [globalPinnedTabs, setGlobalPinnedTabs] = useState<IPinnedTab[]>([]);

  useEffect(() => {
    (async () => {
      setIsLoadingSpaces(true);

      const allOtherSpaces = await getAllOtherSpaces();

      setNonActiveSpaces(allOtherSpaces);
      // set app settings
      const settings = await getAppSettings();

      setAppSetting(settings);
      const pinnedTabs = await getGlobalPinnedTabs();
      setGlobalPinnedTabs(pinnedTabs);
      setIsLoadingSpaces(false);
    })();
    // eslint-disable-next-line
  }, []);

  // loading state for save spaces to bookmarks
  const [isLoadingSaveSpaces, setIsLoadingSaveSpaces] = useState(false);

  // expand the active space by default, if this preference is set by user

  // listen to events from  background
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

    processedEvents.push(event.id);

    // handle events
    await handleEvents(msg as IMessageEvent);

    // add to processed events

    response(true);
  });

  // sync/save spaces to bookmarks
  const handleSaveSpacesToBM = async () => {
    setIsLoadingSaveSpaces(true);

    await syncSpacesToBookmark();

    setIsLoadingSaveSpaces(false);

    setSnackbar({ show: true, isSuccess: true, msg: 'Saved spaces to bookmarks' });
  };

  // handle tab drag
  // handle tabs drag end
  const onTabsDragEnd: OnDragEndResponder = result => {
    if (!result.destination) {
      return;
    }

    if (result.destination.index === result.source.index) return;

    const droppedSpaceId = result.destination.droppableId;
    const reOrderedTabs = [...activeSpace.tabs];
    const [tabToMove] = reOrderedTabs.splice(result.source.index, 1);

    const activeTab = activeSpace?.tabs[activeSpace.activeTabIndex];
    // check if dropped space is active space
    if (droppedSpaceId === activeSpace?.id) {
      // if yes, then re-arrange tabs and update active tab index

      reOrderedTabs.splice(result.destination.index, 0, tabToMove);
      (async () => {
        // move tab in window
        await chrome.tabs.move(tabToMove.id, { index: result.destination.index });
        // update storage
        await setTabsForSpace(activeSpace.id, reOrderedTabs);
      })();

      // save local ui state
      setActiveSpace(prev => ({
        ...prev,
        activeTabIndex: reOrderedTabs.findIndex(el => el.url === activeTab.url),
        tabs: reOrderedTabs,
      }));
      return;
    }

    // if no then remove tab from active space and rearrange tabs
    (async () => {
      // save the tabs (with removed dragged tab) in active space
      await setTabsForSpace(activeSpace.id, reOrderedTabs);
      // add tab to new dragged space
      const tabsInNewSpace = await getTabsInSpace(droppedSpaceId);
      await setTabsForSpace(droppedSpaceId, [...tabsInNewSpace, tabToMove]);
      // save local ui state
      setActiveSpace(prev => ({
        ...prev,
        activeTabIndex: reOrderedTabs.findIndex(el => el.url === activeTab.url),
        tabs: reOrderedTabs,
      }));
    })();
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
          <FavTabs tabs={globalPinnedTabs} isGlobal={true} />
        </div>

        {/* spaces container */}
        <div className="w-full h-[85%] bg-red-30 px-3 py-1  scroll-p-px scroll-m-px relative ">
          {/* un saved  */}
          {isLoadingSpaces ? (
            <Spinner size="md" />
          ) : (
            <DragDropContext onDragEnd={onTabsDragEnd}>
              {/* Current space */}
              <div className="h-[80%]">
                <ActiveSpace space={activeSpace} setActiveSpace={setActiveSpace} />
              </div>

              {/* other spaces */}
              <div className=" h-[20%] bg-indigo-300 flex gap-x-2 ">
                {[{ id: 'new-space' }, ...nonActiveSpaces].map(space => (
                  <Droppable key={space.id} droppableId={space.id}>
                    {(provided, snapshot) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="">
                        {space.id !== 'new-space' ? (
                          <NonActiveSpace space={space as ISpace} isDraggedOver={snapshot.isDraggingOver} />
                        ) : (
                          // new space zone
                          <div className="bg-brand-darkBgAccent cursor-pointer flex items-center justify-center w-[60px] h-[60px] rounded">
                            <MdAdd className="text-2xl font-extralight text-slate-500" />
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
          {/* update space */}
          <UpdateSpace
            space={spaceToUpdate && omitObjProps(spaceToUpdate, 'tabs')}
            numTabs={spaceToUpdate?.tabs?.length}
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
