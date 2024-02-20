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
        <div key={tab.snoozedAt} className="max-w-full px-1 bg-brand-darkBgAccent/30 rounded-lg py-1 ">
          <div className="flex items-center px-1.5 mt-1.5">
            <img src={tab.faviconUrl} alt="icon" className="w-4 h-4 rounded-md mr-2 opacity-90" />
            <p className="text-slate-300 min-w-[80%] whitespace-nowrap overflow-hidden text-ellipsis">{tab.title}</p>
          </div>
          <div className="flex mt-1 px-3">
            <span className="text-slate-400 bg-brand-darkBg/50 px-2.5 py-1 rounded font-medium ml-auto">
              <span className="opacity-90">⏰</span> &nbsp;
              <Tooltip label={new Date(tab.snoozedUntil).toLocaleString()}>
                <span className="font-semibold">{getTimeAgo(tab.snoozedUntil)}</span>
              </Tooltip>
            </span>
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
