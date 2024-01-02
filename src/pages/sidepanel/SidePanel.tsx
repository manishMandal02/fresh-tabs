import { useState, useEffect } from 'react';
import { IMessageEvent, ISpaceWithTabs } from '../types/global.types';
import { CreateSpace, Space, UpdateSpace } from './components/space';
import Snackbar from './components/elements/snackbar';
import { useAtom } from 'jotai';
import { snackbarAtom } from '@root/src/stores/app';
import Spinner from './components/elements/spinner';
import { useSidePanel } from './hooks/useSidePanel';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import Settings from './components/settings/Settings';

// event ids of processed events
const processedEvents: string[] = [];

const SidePanel = () => {
  // space opened for update
  const [spaceToUpdate, setSpaceToUpdate] = useState<ISpaceWithTabs | undefined>(undefined);

  // custom hook
  const { spaces, appSettings, getActiveSpaceId, handleEvents, onDragEnd } = useSidePanel();

  // active space in the window
  const [activeSpaceId, setActiveSpaceId] = useState('');

  // expanded space
  const [expandedSpaceId, setExpandedSpaceId] = useState('');

  // loading space state
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false);

  // snackbar global state/atom
  const [snackbar] = useAtom(snackbarAtom);

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

  // set active space after loading all spaces
  useEffect(() => {
    (async () => {
      setIsLoadingSpaces(true);

      // get active space
      const spaceId = await getActiveSpaceId();

      setActiveSpaceId(spaceId);

      setIsLoadingSpaces(false);
    })();
  }, [spaces]);

  // expand active space by default based on preferences
  useEffect(() => {
    if (appSettings.activeSpaceExpanded) {
      setExpandedSpaceId(activeSpaceId);
    } else {
      setExpandedSpaceId('');
    }

    // todo - temp
    setSpaceToUpdate(spaces.find(s => s.id === activeSpaceId));
  }, [activeSpaceId, appSettings]);

  // const handleSearchShortcut: EventListener = ev => {
  //   console.log('🚀 ~ file: SidePanel.tsx:82 ~ SidePanel ~ ev:', ev);

  //   return;
  // };

  // useEffect(() => {
  //   document.addEventListener('keypress', handleSearchShortcut);
  // }, []);

  return (
    <div className="w-screen h-screen  overflow-hidden bg-brand-background">
      <main className="h-full relative ">
        {/* app name */}
        <div className="h-[10%] pt-2.5 flex items-start justify-between px-3">
          <span className="invisible">Hide</span>
          <p className=" text-slate-400 text-base font-light tracking-wide  text-center">Fresh Tabs</p>
          {/* opens settings modal */}
          <Settings />
        </div>

        <p className="text-base text-slate-500 bg-brand-background  mb-1.5 ml-3 tracking-wide select-none">Spaces</p>
        {/* spaces container */}
        <div className="w-full min-h-min bg-indigo- h-[90%] px-3  scroll-p-px scroll-m-px relative overflow-y-auto">
          {/* un saved  */}
          {isLoadingSpaces ? (
            <Spinner size="md" />
          ) : (
            <>
              {/* unsaved spaces, sort based on title */}
              {spaces
                ?.toSorted((a, b) => (a.title > b.title ? 1 : -1))
                .map(({ tabs, ...space }) =>
                  !space.isSaved ? (
                    <Space
                      key={space.id}
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
                {spaces.find(s => !s.isSaved) ? (
                  <hr className="h-px bg-slate-700/30 border-none rounded-md w-[60%] mt-0 mb-2 mx-auto" />
                ) : null}
              </>
              {/* saved spaces */}
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId={'saved-spaces'}>
                  {provided1 => (
                    <div
                      {...provided1.droppableProps}
                      ref={provided1.innerRef}
                      className="h-[220px]"
                      style={{ height: `${spaces.filter(s => s.isSaved).length * 3.5}rem` }}>
                      {/* map spaces  */}
                      {spaces?.map(({ tabs, ...space }, idx) =>
                        space.isSaved ? (
                          <Draggable draggableId={space.id} index={idx} key={space.id}>
                            {provided2 => (
                              <div
                                ref={provided2.innerRef}
                                {...provided2.draggableProps}
                                {...provided2.dragHandleProps}
                                className="h-fit max-h-fit">
                                <Space
                                  space={space}
                                  tabs={tabs}
                                  isActive={activeSpaceId === space.id}
                                  isExpanded={expandedSpaceId === space.id}
                                  onExpand={() => setExpandedSpaceId(prevId => (prevId !== space.id ? space.id : ''))}
                                  onUpdateClick={() => setSpaceToUpdate({ ...space, tabs })}
                                />
                              </div>
                            )}
                          </Draggable>
                        ) : null,
                      )}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          )}
          {/* add new space */}
          <CreateSpace />
          {/* update space */}
          <UpdateSpace
            space={spaceToUpdate}
            isActive={spaceToUpdate?.id === activeSpaceId}
            tabs={spaceToUpdate?.tabs}
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
