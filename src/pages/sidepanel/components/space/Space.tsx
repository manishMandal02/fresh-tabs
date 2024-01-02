import { MouseEventHandler } from 'react';
import { ISpace, ISpaceWithTabs, ITab } from '@root/src/pages/types/global.types';
import { MdArrowForwardIos, MdOutlineSettings, MdOutlineOpenInBrowser } from 'react-icons/md';
import Tab from './Tab';
import Tooltip from '../elements/tooltip';
import { openSpace } from '@root/src/services/chrome-tabs/tabs';
import { removeTabFromSpace } from '@root/src/services/chrome-storage/tabs';
import { useAtom } from 'jotai';
import { appSettingsAtom, snackbarAtom, spacesAtom } from '@root/src/stores/app';

const SPACE_HEIGHT = 45;

type Props = {
  space: ISpace;
  tabs: ITab[];
  onUpdateClick: () => void;
  isActive: boolean;
  isExpanded: boolean;
  onExpand: () => void;
};

const Space = ({ space, tabs, onUpdateClick, isActive, isExpanded, onExpand }: Props) => {
  // spaces atom (global state)
  const [, setSpaces] = useAtom(spacesAtom);

  // snackbar atom
  const [, setSnackbar] = useAtom(snackbarAtom);

  // settings atom
  const [appSettings] = useAtom(appSettingsAtom);

  // on setting click
  const onSettingsClick: MouseEventHandler<SVGElement> = ev => {
    ev.stopPropagation();
    onUpdateClick();
  };

  // check if space is opened

  // open space in new window
  const handleOpenSpace: MouseEventHandler<SVGElement> = async ev => {
    ev.stopPropagation();

    // update window id for the space when new window gets created
    const onNewWindowCreated = (windowId: number) => {
      setSpaces(prevSpace => [
        ...prevSpace.map(s => {
          // remove new window id from prev space
          if (appSettings.openSpace && s.windowId === windowId) {
            s.windowId = 0;
          }
          if (s.id === space.id) {
            s.windowId = windowId;
          }

          return s;
        }),
      ]);
    };
    await openSpace({ space, onNewWindowCreated, tabs, openWindowType: appSettings.openSpace });
  };

  // handle remove tab from space
  const handleRemoveTab = async (id: number, idx: number) => {
    // remove tab
    const res = await removeTabFromSpace(space, id, true);

    // tab removed
    if (res) {
      const updatedSpace: ISpaceWithTabs = { ...space, tabs: [...tabs.filter(t => t.id !== id)] };
      // update the space active tab index if the removed tab was the last active tab
      if (space.activeTabIndex === idx) {
        updatedSpace.activeTabIndex = 0;
      }
      // re-render updated tabs
      setSpaces(prev => [...prev.filter(s => s.id !== space.id), updatedSpace]);

      setSnackbar({ show: true, msg: 'Tab removed', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to remove tab', isSuccess: false });
    }
  };

  return (
    <div
      className={`text-slate-100 w-full  flex items-center justify-start  flex-col select-none
                            transition-all duration-200 ease-in-out  mb-2.5 pb-px bg-slate-800   rounded-md 
                          `}
      style={{
        borderColor: space.theme,
        borderWidth: '0px 0px 0px 5px',
        borderLeftWidth: isExpanded ? '3px' : '5px',
        height: isExpanded ? 'min-content' : `${SPACE_HEIGHT}px`,
        maxHeight: isExpanded ? `${440}px` : `${SPACE_HEIGHT}px`,
      }}>
      {/* space info container */}
      <button
        className="py-3 px-3 w-full h-[2.5rem] flex items-center justify-between  border-slate-700 group"
        onClick={onExpand}
        style={{
          borderBottomWidth: isExpanded ? '1px' : '0px',
          opacity: space.isSaved ? '1' : '0.75',
        }}>
        {/* title container */}
        <div className="flex items-center gap-x-1">
          <p className="text-base">{space.emoji}</p>
          <p className="text-sm  text-slate-100">{space.title}</p>
          {isActive ? (
            <>
              {/* active space indicator */}
              <Tooltip label="Active space">
                <span className="relative flex h-2 w-2 ml-1">
                  <span
                    className="animate-ping absolute inline-flex h-full w-full rounded-full  opacity-75 "
                    style={{
                      backgroundColor: space.theme,
                      opacity: '0.7',
                    }}></span>
                  <span
                    className="relative inline-flex rounded-full h-2 w-2 "
                    style={{
                      backgroundColor: space.theme,
                    }}></span>
                </span>
              </Tooltip>
            </>
          ) : (
            <>
              {/* open space in new window btn */}
              <Tooltip label="Open in new window">
                <MdOutlineOpenInBrowser
                  className="text-slate-500 ml-px -mb-px cursor-pointer hover:text-slate-400 hover:-translate-y-px transition-all duration-200 "
                  size={20}
                  onClick={handleOpenSpace}
                  onMouseOver={ev => ev.stopPropagation()}
                />
              </Tooltip>
            </>
          )}

          {isExpanded ? (
            <>
              {/* update btn */}
              <MdOutlineSettings
                className="text-slate-600 ml-1 cursor-pointer hover:text-slate-500 transition-all duration-200"
                size={18}
                onClick={onSettingsClick}
              />
            </>
          ) : null}
        </div>
        {/* right-end container */}
        <div className="flex items-center">
          <span className="text-[.8rem] mr-2.5 opacity-80">{tabs.length}</span>
          {/* <SlOptionsVertical className="text-slate-300 text-sm cursor-pointer" /> */}
          <span className="group-hover:animate-bounce ">
            <MdArrowForwardIos
              className={`text-slate-300 text-xs transition-all  duration-200 ${
                !isExpanded ? 'group-hover:rotate-90 rotate-0' : 'group-hover:rotate-0 rotate-90'
              }`}
            />
          </span>
        </div>
      </button>
      {/* tabs within opened space */}
      {isExpanded ? (
        <div
          className={`m-0 mt-1 w-full 
                  transition-all duration-200 ease-in-out overflow-x-hidden overflow-y-auto  scroll-m-px scroll-p-0`}>
          {tabs.map((tab, idx) => (
            <Tab
              key={tab?.id}
              tabData={tab}
              isTabActive={space.activeTabIndex === idx}
              onTabDelete={async () => await handleRemoveTab(tab.id, idx)}
              isSpaceActive={isActive}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Space;
