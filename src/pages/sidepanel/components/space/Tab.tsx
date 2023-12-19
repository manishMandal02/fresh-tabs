import { ITab } from '@root/src/pages/types/global.types';
import { copyToClipboard } from '@root/src/pages/utils/copyToClipboard';
import { createTab } from '@root/src/services/tabs';
import { MdDelete, MdContentCopy, MdOpenInNew } from 'react-icons/md';

type Props = {
  tabData: ITab;
  showHoverOption?: boolean;
};
const Tab = ({ tabData, showHoverOption = true }: Props) => {
  // handle open tab
  const handleOpenTab = async () => await createTab(tabData.url);
  // handle copy tab url
  const handleCopyTabURL = async () => await copyToClipboard(tabData.url);

  return (
    <div className=" w-full relative px-2.5 py-1.5 flex items-center justify-between shadow-sm shadow-slate-700/80 group">
      <span className="flex items-center w-full ">
        <img className="w-4 h-4 mr-1.5 rounded-full" src={tabData.faviconURI} alt="icon" />
        <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
          {tabData.url}
        </span>
      </span>
      {showHoverOption ? (
        <span className="absolute hidden group-hover:flex right-2 bottom-2 items-center gap-x-3">
          <MdContentCopy
            className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
            onClick={handleCopyTabURL}
          />
          <MdOpenInNew
            className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
            onClick={handleOpenTab}
          />
          <MdDelete
            className={` text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80`}
          />
        </span>
      ) : null}
    </div>
  );
};

export default Tab;