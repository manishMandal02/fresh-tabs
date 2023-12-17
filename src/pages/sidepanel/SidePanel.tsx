import { useState, useEffect } from 'react';
import { ISpace } from '../types/global.types';
import { MdArrowForwardIos, MdDelete, MdContentCopy, MdOpenInNew } from 'react-icons/md';
import { testSpaces } from './testData';

const SPACE_HEIGHT = 45;

const SidePanel = () => {
  const [spaces, setSpaces] = useState<ISpace[] | undefined>(undefined);

  // open space
  const [openedSpace, setOpenedSpace] = useState<ISpace | undefined>(undefined);

  useEffect(() => {
    const sortedSpaces = testSpaces.sort(a => {
      if (!a.isSaved) {
        return -1;
      } else {
        return 1;
      }
    });

    setSpaces(sortedSpaces);
  }, []);

  const handleOpenedSpace = (space: ISpace) => {
    const newOpenedSpace = openedSpace && openedSpace.id === space.id ? undefined : space || undefined;

    setOpenedSpace(newOpenedSpace);
  };

  // check if space is opened
  const isSpaceOpened = (space: ISpace) => (openedSpace && openedSpace.id === space.id) || false;

  return (
    <div className="w-screen h-screen  overflow-hidden bg-brand-background">
      <main className="h-full ">
        {/* heading */}
        <p className="h-[3%] text-slate-300 text-[.9rem] font-extralight pt-1  text-center">Fresh Tabs</p>

        {/* spaces */}
        <div className="w-full  h-[97%] pt-10 px-3">
          <p className="text-sm text-slate-500  mb-1.5 tracking-wide select-none">Spaces</p>
          {/* un saved  */}
          {spaces?.map(space => (
            <>
              <div
                key={space.title}
                className={`text-slate-100 w-full  flex items-center justify-start  flex-col select-none
                            transition-all duration-200  mb-2.5 pb-2 bg-slate-800   rounded-md 
                          `}
                style={{
                  borderColor: space.theme,
                  borderWidth: '0px 0px 0px 3px',
                  // borderLeftWidth: isSpaceOpened(space) ? '1px' : '0px',
                  // borderRightWidth: isSpaceOpened(space) ? '1px' : '0px',
                  height: isSpaceOpened(space) ? 'min-content' : `${SPACE_HEIGHT}px`,
                  maxHeight: isSpaceOpened(space)
                    ? `calc(100% - ${spaces.length * (SPACE_HEIGHT + 5)}px)`
                    : `${SPACE_HEIGHT}px`,
                }}>
                {/* space info container */}
                <button
                  className="py-3 px-3 w-full h-[2.5rem] flex items-center justify-between  border-slate-700 group"
                  onClick={() => handleOpenedSpace(space)}
                  style={{
                    borderBottomWidth: isSpaceOpened(space) ? '1px' : '0px',
                    opacity: space.isSaved ? '1' : '0.6',
                  }}>
                  {/* title container */}
                  <div className="flex items-center gap-x-1">
                    <p className="text-base font-medium text-slate-50">{space.emoji}</p>
                    <p className="text-sm font-medium text-slate-50">{space.title}</p>
                    {/* active space indicator */}
                    {isSpaceOpened(space) ? (
                      <span className="relative flex h-1.5 w-1.5 ml-px">
                        <span
                          className="animate-ping absolute inline-flex h-full w-full rounded-full  opacity-75 "
                          style={{
                            backgroundColor: space.theme,
                            opacity: '0.7',
                          }}></span>
                        <span
                          className="relative inline-flex rounded-full h-1.5 w-1.5 "
                          style={{
                            backgroundColor: space.theme,
                          }}></span>
                      </span>
                    ) : null}
                  </div>
                  {/* right-end container */}
                  <div className="flex items-center">
                    <span className="text-[.8rem] mr-2.5 opacity-80">{space.tabs.length}</span>
                    {/* <SlOptionsVertical className="text-slate-300 text-sm cursor-pointer" /> */}
                    <span className="group-hover:animate-bounce ">
                      <MdArrowForwardIos
                        className={`text-slate-300 text-xs transition-all  duration-200 ${
                          !isSpaceOpened(space) ? 'group-hover:rotate-90 rotate-0' : 'group-hover:rotate-0 rotate-90'
                        }`}
                      />
                    </span>
                  </div>
                </button>
                {/* tabs within opened space */}
                {isSpaceOpened(space) ? (
                  <div className=" mt-1  h-[calc(100%-40px)] overflow-x-hidden overflow-y-auto w-full scroll-m-1 scroll-p-0">
                    {space.tabs.map(tab => (
                      <div
                        className=" w-full relative px-2.5 py-1.5 flex items-center justify-between shadow-sm shadow-slate-700/50 group"
                        key={tab.id}>
                        <span className="flex items-center w-full ">
                          <img className="w-4 h-4 mr-2 rounded-full" src={tab.faviconURI} alt="icon" />
                          <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
                            {tab.url}
                          </span>
                        </span>
                        <span className="absolute hidden group-hover:flex right-2 bottom-2 items-center gap-x-3">
                          <MdContentCopy className=" text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80" />
                          <MdOpenInNew className=" text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80" />
                          <MdDelete className=" text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80" />
                        </span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </>
          ))}
        </div>
      </main>
    </div>
  );
};

export default SidePanel;
