import { ISnoozedTab } from '@root/src/pages/types/global.types';
import { MdArrowBack } from 'react-icons/md';

type Props = {
  tabs: ISnoozedTab[];
  onClose: () => void;
};
const SnoozedTabs = ({ tabs, onClose }: Props) => {
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div className="absolute z-[999] top-0 left-0 h-full w-full bg-brand-darkBg" onClick={ev => ev.stopPropagation()}>
      {/* heading */}
      <div className="flex items-center justify-between px-2 text-slate-500 pt-1.5 pb-2">
        <MdArrowBack
          className="cursor-pointer hover:opacity-90 transition-all duration-200"
          size={16}
          onClick={onClose}
        />
        <span className="flex items-center">
          <p className="text-sm font-light">Snoozed Tabs</p>
          <p className="text-slate-400/80 text-[10px] px-[6px] py-[0.6px] bg-brand-darkBgAccent/40 rounded ml-1.5">
            {tabs.length}
          </p>
        </span>
        <span></span>
      </div>
      {/* tabs */}
      <div className="flex">
        {tabs?.map(tab => (
          <div
            key={tab.snoozedAt}
            className=" flex items-center justify-start max-w-full h-[2.2rem] px-1.5 bg-brand-darkBgAccent/80 rounded-lg py-1 ">
            <img src={tab.faviconUrl} alt="icon" className="w-4 h-4 rounded-md mr-1.5 opacity-90" />
            <p className="text-slate-400 min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">{tab.title}</p>
          </div>
        ))}

        {/* no snoozed tabs */}
        <p className="text-slate-500 text-[14px] font-light mt-6 mx-auto">No snoozed tabs for this space</p>
      </div>
    </div>
  );
};

export default SnoozedTabs;
