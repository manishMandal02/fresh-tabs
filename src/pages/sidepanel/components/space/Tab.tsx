import { ITab } from '@root/src/pages/types/global.types';
import { MdDelete, MdContentCopy, MdOpenInNew } from 'react-icons/md';

type Props = {
  tabData: ITab;
  showHoverOption?: boolean;
};
const Tab = ({ tabData, showHoverOption = true }: Props) => {
  return (
    <>
      <div
        className=" w-full relative px-2.5 py-1.5 flex items-center justify-between shadow-sm shadow-slate-700/80 group"
        key={tabData.id}>
        <span className="flex items-center w-full ">
          <img className="w-4 h-4 mr-1.5 rounded-full" src={tabData.faviconURI} alt="icon" />
          <span className="text-xs text-slate-400 max-w-fit min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">
            {tabData.url}
          </span>
        </span>
        {showHoverOption ? (
          <span className="absolute hidden group-hover:flex right-2 bottom-2 items-center gap-x-3">
            <MdContentCopy className=" text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80" />
            <MdOpenInNew className=" text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80" />
            <MdDelete className=" text-slate-700 text-xs cursor-pointer bg-slate-400 px-[.75px] py-[1.5px] rounded-sm scale-150 transition-all duration-200 hover:bg-slate-400/80" />
          </span>
        ) : null}
      </div>
    </>
  );
};

export default Tab;
