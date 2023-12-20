import { useState, MouseEventHandler } from 'react';
import { ISpace } from '@root/src/pages/types/global.types';
import { MdArrowForwardIos, MdOutlineSettings, MdOutlineOpenInBrowser } from 'react-icons/md';
import Tab from './Tab';
import Tooltip from '../tooltip';
import { openSpace } from '@root/src/services/chrome-tabs/tabs';

const SPACE_HEIGHT = 45;

type Props = {
  space: ISpace;
  numSpaces: number;
  onUpdateClick: () => void;
  isActive: boolean;
};

const Space = ({ space, numSpaces, onUpdateClick, isActive }: Props) => {
  // opened space
  const [expandedSpace, setExpandedSpace] = useState<ISpace | undefined>(undefined);

  const handleExpandSpace = (currSpace: ISpace) => {
    const newOpenedSpace = expandedSpace && expandedSpace.id === currSpace.id ? undefined : currSpace || undefined;

    setExpandedSpace(newOpenedSpace);
  };

  // on setting click
  const onSettingsClick: MouseEventHandler<SVGElement> = ev => {
    ev.stopPropagation();
    onUpdateClick();
  };

  // check if space is opened
  const isSpaceExpanded = (currSpace: ISpace) => (expandedSpace && expandedSpace.id === currSpace.id) || false;

  // open space in new window
  const handleOpenSpace = async () => {
    await openSpace(
      space.tabs.map(s => s.url),
      space.activeTabIndex,
    );
  };

  return (
    <div
      className={`text-slate-100 w-full  flex items-center justify-start  flex-col select-none
                            transition-all duration-200  mb-2.5 pb-2 bg-slate-800   rounded-md 
                          `}
      style={{
        borderColor: space.theme,
        borderWidth: '0px 0px 0px 3px',
        // borderLeftWidth: isSpaceExpanded(space) ? '1px' : '0px',
        // borderRightWidth: isSpaceExpanded(space) ? '1px' : '0px',
        height: isSpaceExpanded(space) ? 'min-content' : `${SPACE_HEIGHT}px`,
        maxHeight: isSpaceExpanded(space) ? `calc(100% - ${numSpaces * (SPACE_HEIGHT + 5)}px)` : `${SPACE_HEIGHT}px`,
      }}>
      {/* space info container */}
      <button
        className="py-3 px-3 w-full h-[2.5rem] flex items-center justify-between  border-slate-700 group"
        onClick={() => handleExpandSpace(space)}
        style={{
          borderBottomWidth: isSpaceExpanded(space) ? '1px' : '0px',
          opacity: space.isSaved ? '1' : '0.75',
        }}>
        {/* title container */}
        <div className="flex items-center gap-x-1">
          <p className="text-base font-medium text-slate-50">{space.emoji}</p>
          <p className="text-sm font-medium text-slate-50">{space.title}</p>
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
                  className="text-slate-500 ml-px -mb-1 cursor-pointer hover:text-slate-400 hover:-translate-y-px transition-all duration-200 "
                  size={20}
                  onClick={handleOpenSpace}
                  onMouseOver={ev => ev.stopPropagation()}
                />
              </Tooltip>
            </>
          )}

          {isSpaceExpanded(space) ? (
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
          <span className="text-[.8rem] mr-2.5 opacity-80">{space.tabs.length}</span>
          {/* <SlOptionsVertical className="text-slate-300 text-sm cursor-pointer" /> */}
          <span className="group-hover:animate-bounce ">
            <MdArrowForwardIos
              className={`text-slate-300 text-xs transition-all  duration-200 ${
                !isSpaceExpanded(space) ? 'group-hover:rotate-90 rotate-0' : 'group-hover:rotate-0 rotate-90'
              }`}
            />
          </span>
        </div>
      </button>
      {/* tabs within opened space */}
      {isSpaceExpanded(space) ? (
        <div className=" mt-1  h-[calc(100%-40px)] overflow-x-hidden overflow-y-auto w-full scroll-m-1 scroll-p-0">
          {space.tabs.map(tab => (
            <Tab key={tab.url} tabData={tab} />
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default Space;
