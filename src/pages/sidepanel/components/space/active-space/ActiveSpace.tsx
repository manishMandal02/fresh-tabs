import { ISpace, ISpaceWithTabs, ITab } from '@root/src/pages/types/global.types';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import MoreOptions from '../more-options';
import { selectedTabsAtom, snackbarAtom } from '@root/src/stores/app';
import { SetStateAction, useAtom } from 'jotai';
import { removeTabFromSpace, setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { Dispatch, useState } from 'react';
import { Tab } from '../tab';
import DeleteSpaceModal from '../delete/DeleteSpaceModal';
import { createPortal } from 'react-dom';
import UpdateSpace from '../update/UpdateSpace';
import { motion } from 'framer-motion';

type Props = {
  space: ISpace;
  tabs: ITab[];
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
};

const ActiveSpace = ({ space, tabs, setActiveSpace }: Props) => {
  console.log('🚀 ~ ActiveSpace ~ space:', space);

  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);

  // local state - show delete modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  // local state - show delete modal
  const [showEditModal, setShowEditModal] = useState(false);

  // local state - show delete modal
  const [selectedTabs, setSelectedTabs] = useAtom(selectedTabsAtom);

  // sync tabs
  const handleSyncTabs = async () => {
    setSnackbar({ msg: '', show: false, isLoading: true });

    // get all tabs in the window
    const currentTabs = await chrome.tabs.query({ currentWindow: true });

    const tabsInWindow = currentTabs.map(t => ({ title: t.title, url: t.url, id: t.id }));

    const activeTab = currentTabs.find(t => t.active);

    // update space's active tab index if not correct
    if (space.activeTabIndex !== activeTab.index) {
      await updateSpace(space.id, { ...space, activeTabIndex: activeTab.index });
    }
    // update tabs in space
    await setTabsForSpace(space.id, tabsInWindow);

    setActiveSpace({ ...space, activeTabIndex: activeTab.index, tabs: [...tabsInWindow] });

    setSnackbar({ msg: '', show: false, isLoading: false });

    setSnackbar({ msg: 'Tabs synced', show: true, isLoading: false, isSuccess: true });
  };

  // handle remove tab from space
  const handleRemoveTab = async (index: number) => {
    // remove tab
    await removeTabFromSpace(space, null, index, true);

    // update ui
    setActiveSpace({ ...space, tabs: [...tabs.filter((_t, idx) => idx !== index)] });
  };

  // handle tab click/ go to tab
  const onTabClick = (index: number) => {
    setActiveSpace({ ...space, tabs, activeTabIndex: index });
  };

  // active tab indicator/div animation
  const activeTabIndicatorAnimation = {
    initial: { scale: 0, opacity: 0 },
    animate: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40, duration: 0.2 },
  };

  return space?.id ? (
    <div className="h-full mt-4">
      {/* fav tabs */}

      <div className="flex items-start h-[5%] justify-between px-2">
        <div className="flex items-center">
          <div className="text-lg  border-r  pr-3  w-fit select-none" style={{ borderColor: space.theme }}>
            {space.emoji}
          </div>
          <p className="text-base font-light text-slate-400 ml-2.5">{space.title}</p>
        </div>

        {/* more options menu */}
        <div className="flex items-center select-none">
          <span className="text-slate-500 mr-1 ">{tabs.length}</span>
          <MoreOptions
            shouldOpenInNewWindow={false}
            isSpaceActive={true}
            onSyncClick={handleSyncTabs}
            onEditClick={() => setShowEditModal(true)}
            onDeleteClick={() => setShowDeleteModal(true)}
          />
        </div>
      </div>

      {/* tabs */}
      <div className="h-[90%] overflow-y-auto cc-scrollbar overflow-x-hidden">
        <Droppable droppableId={space.id}>
          {provided1 => (
            <div {...provided1.droppableProps} ref={provided1.innerRef} className="min-h-full py-2">
              {/* render draggable  */}
              {tabs.map((tab, idx) => (
                <Draggable draggableId={tab.id.toString()} index={idx} key={tab.id}>
                  {provided2 => (
                    <div
                      ref={provided2.innerRef}
                      {...provided2.draggableProps}
                      {...provided2.dragHandleProps}
                      className="relative">
                      <div className="">
                        <Tab
                          tabData={tab}
                          isSpaceActive={true}
                          isTabActive={space.activeTabIndex === idx}
                          onTabDelete={() => handleRemoveTab(idx)}
                          onTabClick={() => onTabClick(idx)}
                          isSelected={!!selectedTabs.find(t => t.id === tab.id)?.id}
                          onSelect={() => setSelectedTabs(prev => [...prev, tab])}
                        />
                      </div>
                      {/* active tab indicator */}
                      {space.activeTabIndex === idx ? (
                        <motion.div
                          {...activeTabIndicatorAnimation}
                          className="absolute h-[1.7rem] w-[98%] top-0 left-0 rounded-lg bg-brand-darkBgAccent z-10"></motion.div>
                      ) : null}
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </div>
      {/* delete space alert modal */}
      {showDeleteModal &&
        createPortal(
          <DeleteSpaceModal spaceId={space.id} show={showDeleteModal} onClose={() => setShowDeleteModal(false)} />,
          document.body,
        )}
      {showEditModal &&
        createPortal(
          <UpdateSpace space={space} numTabs={tabs?.length} onClose={() => setShowEditModal(false)} />,
          document.body,
        )}
    </div>
  ) : null;
};

export default ActiveSpace;
