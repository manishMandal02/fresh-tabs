import { ISnoozedTab } from '@root/src/pages/types/global.types';
import { getTimeAgo } from '@root/src/pages/utils/date-time/time-ago';
import Tooltip from '../../elements/tooltip';

type Props = {
  tabs: ISnoozedTab[];
};
const SnoozedTabs = ({ tabs }: Props) => {
  return (
    <div className="flex">
      {tabs?.map(tab => (
        <div
          key={tab.snoozedAt}
          className="max-w-full w-full flex justify-center pl-2  pr-1 bg-brand-darkBgAccent/30 rounded-lg py-1.5 ">
          <div className="w-[10%] flex items-center">
            <img src={tab.faviconUrl} alt="icon" className="w-[1.7rem] h-[1.7rem] rounded-md opacity-90" />
          </div>
          <div className="flex flex-col justify-center w-[90%] pl-1.5 mt-1">
            <p className="text-slate-300/90 max-w-[97%] whitespace-nowrap overflow-hidden text-ellipsis">{tab.title}</p>
            <div className="text-slate-400 flex items-center justify-between">
              {/* snoozed at time */}
              <span className="text-[11px] font-medium opacity-60 ml-px ">snoozed {getTimeAgo(tab.snoozedAt)}</span>
              {/* snoozed until */}
              <span className=" bg-brand-darkBg/70 w-fit px-2 py-px rounded font-medium mr-2.5 -mb-px">
                <span className="opacity-90">⏰</span> &nbsp;
                <Tooltip label={new Date(tab.snoozedUntil).toLocaleString()}>
                  <span className="font-semibold text-[11px]">{getTimeAgo(tab.snoozedUntil)}</span>
                </Tooltip>
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* no snoozed tabs */}
      {tabs?.length < 1 ? (
        <p className="text-slate-500 text-[14px] font-light mt-6 mx-auto">No snoozed tabs for this space</p>
      ) : null}
    </div>
  );
};

export default SnoozedTabs;
