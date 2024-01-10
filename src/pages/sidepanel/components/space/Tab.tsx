import { ITab } from '@root/src/pages/types/global.types';
import { getFaviconURL } from '@root/src/pages/utils';
import { copyToClipboard } from '@root/src/pages/utils/copy-to-clipboard';
import { createTab, goToTab } from '@root/src/services/chrome-tabs/tabs';
import { MdDelete, MdContentCopy, MdOpenInNew, MdMyLocation } from 'react-icons/md';

type Props = {
  tabData: ITab;
  showHoverOption?: boolean;
  onTabDelete?: () => Promise<void>;
  isTabActive: boolean;
  isSpaceActive?: boolean;
  showDeleteOption?: boolean;
};
const Tab = ({
  tabData,
  onTabDelete,
  isTabActive,
  isSpaceActive,
  showDeleteOption = true,
  showHoverOption = true,
}: Props) => {
  // handle open tab
  const handleOpen = async () => {
    if (!isSpaceActive) {
      // if the tab is not active, create a new tab
      await createTab(tabData.url);
      return;
    }

    // if the space is active, just go to the tab
    await goToTab(tabData.id);
  };
  // handle copy tab url
  const handleCopyURL = async () => await copyToClipboard(tabData.url);

  return (
    <div
      className={` w-full relative px-2.5 py-1.5 flex rounded-sm items-center justify-between shadow-sm shadow-slate-700/80 group ${
        isTabActive ? ' bg-slate-700/30' : ''
      }`}>
      <span className="flex items-center w-full ">
        <img className="w-4 h-4 mr-1.5 rounded-sm" src={getFaviconURL(tabData.url)} alt="icon" />
        <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
          {tabData.title}
        </span>
      </span>
      {showHoverOption ? (
        <span className="absolute hidden group-hover:flex right-2 bottom-2 items-center gap-x-3">
          {/* go to tab */}
          {isSpaceActive && !isTabActive ? (
            <MdMyLocation
              className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
              onClick={handleOpen}
            />
          ) : null}
          {/* open tab  */}
          {!isSpaceActive ? (
            <MdOpenInNew
              className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
              onClick={handleOpen}
            />
          ) : null}
          <MdContentCopy
            className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
            onClick={handleCopyURL}
          />
          {showDeleteOption ? (
            <MdDelete
              className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
              onClick={onTabDelete}
            />
          ) : null}
        </span>
      ) : null}
    </div>
  );
};

export default Tab;
