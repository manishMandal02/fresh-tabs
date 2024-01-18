import { ISpaceWithTabs } from '@root/src/pages/types/global.types';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import MoreOptions from '../more-options';
import { snackbarAtom } from '@root/src/stores/app';
import { SetStateAction, useAtom } from 'jotai';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import autoAnimate from '@formkit/auto-animate';
import { useEffect, useRef, Dispatch } from 'react';
import { FavTab, Tab } from '../tab';
import { MdAdd } from 'react-icons/md';

type Props = {
  space: ISpaceWithTabs;

  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
};

const textFavTabs = [
  { url: 'https://youtube.com' },
  { url: 'https://www.w3schools.com' },
  { url: 'https://freshinbox.xyz' },
];

const ActiveSpace = ({ space, setActiveSpace }: Props) => {
  console.log('🚀 ~ ActiveSpace ~ space:', space);

  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);

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

  // animate
  const parent = useRef(null);

  useEffect(() => {
    parent.current && autoAnimate(parent.current);
  }, [parent]);

  // add empty object to fav tabs list if less than 5

  textFavTabs.length < 5 && textFavTabs.push({ url: '' });

  return space?.id ? (
    <div className="h-full">
      {/* fav tabs */}
      <div className=" flex items-center justify-around">
        {textFavTabs.map((fav, idx) =>
          fav?.url ? (
            <FavTab url={fav.url} key={fav.url} />
          ) : (
            <div
              className="bg-brand-darkBgAccent/70 w-[28px] h-[28px] rounded-md flex items-center justify-center cursor-pointer"
              key={fav?.url || '' + idx}>
              <MdAdd className="text-base font-extralight text-slate-500" />
            </div>
          ),
        )}
        <span></span>
      </div>
      <div className="flex items-center mb-2 h-[8%] justify-between px-2">
        <div className="flex items-center">
          <div className="text-lg  border-r  pr-3 border-slate-700/60 w-fit">{space.emoji}</div>
          <p className="text-base font-light text-slate-400 ml-2.5">{space.title}</p>
        </div>
        {/* more options menu */}
        <div className="flex items-center">
          <span className="text-slate-500 mr-1 ">{space.tabs.length}</span>
          <MoreOptions
            shouldOpenInNewWindow={false}
            onOpenSpace={() => {}}
            isSpaceActive={true}
            onEditClick={() => {}}
            onSyncClick={handleSyncTabs}
            onDeleteClick={() => {}}
          />
        </div>
      </div>

      {/* tabs */}
      <div className="h-[85%] overflow-y-auto cc-scrollbar">
        <Droppable droppableId={space.id}>
          {provided1 => (
            <div {...provided1.droppableProps} ref={provided1.innerRef} className="min-h-full py-2">
              {/* render draggable  */}

              {space.tabs.map((tab, idx) => (
                <Draggable draggableId={tab.id.toString()} index={idx} key={tab.id}>
                  {provided2 => (
                    <div ref={provided2.innerRef} {...provided2.draggableProps} {...provided2.dragHandleProps}>
                      <Tab tabData={tab} isSpaceActive={true} isTabActive={space.activeTabIndex === idx} />
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
          )}
        </Droppable>
      </div>
    </div>
  ) : null;
};

export default ActiveSpace;
