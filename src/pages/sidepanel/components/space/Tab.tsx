import { ITab } from '@root/src/pages/types/global.types';
import { copyToClipboard } from '@root/src/pages/utils/copy-to-clipboard';
import { createTab } from '@root/src/services/chrome-tabs/tabs';
import { MdDelete, MdContentCopy, MdOpenInNew } from 'react-icons/md';
import Tooltip from '../tooltip';

type Props = {
  tabData: ITab;
  showHoverOption?: boolean;
  onTabDelete?: () => Promise<boolean>;
  isTabActive: boolean;
};
const Tab = ({ tabData, onTabDelete, isTabActive, showHoverOption = true }: Props) => {
  // handle open tab
  const handleOpen = async () => await createTab(tabData.url);
  // handle copy tab url
  const handleCopyURL = async () => await copyToClipboard(tabData.url);

  return (
    <Tooltip delay={1500} label={isTabActive ? 'Last active tab' : ''}>
      <div
        className={` w-full relative px-2.5 py-1.5 flex rounded-sm items-center justify-between shadow-sm shadow-slate-700/80 group ${
          isTabActive ? ' bg-slate-700/30' : ''
        }`}>
        <span className="flex items-center w-full ">
          <img className="w-4 h-4 mr-1.5 rounded-full" src={tabData.faviconURL} alt="icon" />
          <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
            {tabData.title}
          </span>
        </span>
        {showHoverOption ? (
          <span className="absolute hidden group-hover:flex right-2 bottom-2 items-center gap-x-3">
            <MdContentCopy
              className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
              onClick={handleCopyURL}
            />
            <MdOpenInNew
              className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
              onClick={handleOpen}
            />
            <MdDelete
              className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
              onClick={onTabDelete}
            />
          </span>
        ) : null}
      </div>
    </Tooltip>
  );
};

export default Tab;
