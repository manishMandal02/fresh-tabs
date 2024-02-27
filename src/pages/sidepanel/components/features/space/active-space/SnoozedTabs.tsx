import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import Tooltip from '../../../elements/tooltip';
import { ISnoozedTab } from '@root/src/pages/types/global.types';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import { getTimeAgo } from '@root/src/pages/utils/date-time/time-ago';
import { getSnoozedTabs } from '@root/src/services/chrome-storage/snooze-tabs';
import { SlideModal } from '../../../elements/modal';

type Props = {
  spaceId: string;
  show: boolean;
  onClose: () => void;
};

const SnoozedTabs = ({ spaceId, show, onClose }: Props) => {
  const [snoozedTabs, setSnoozedTabs] = useState<ISnoozedTab[]>([]);

  console.log('🚀 ~ SnoozedTabs ~ snoozedTabs:', snoozedTabs);

  useEffect(() => {
    if (!show || !spaceId) return;
    (async () => {
      const snoozedTabsStorage = await getSnoozedTabs(spaceId);
      setSnoozedTabs(snoozedTabsStorage || []);
    })();
  }, [show, spaceId]);

  // TODO - handle delete snoozed

  const { bounce } = useCustomAnimation();

  return (
    <SlideModal isOpen={show} onClose={onClose} title={`Snoozed Tabs (${snoozedTabs?.length || 0})`}>
      <div className="">
        {snoozedTabs?.map(tab => (
          <motion.div
            {...bounce}
            key={tab.snoozedAt}
            className="max-w-full w-full flex justify-center pl-2 mb-1.5 last:mb-0 pr-1 bg-brand-darkBgAccent/30 rounded-lg py-1.5 ">
            <div className="w-[10%] flex items-center">
              <img src={tab.faviconUrl} alt="icon" className="w-[1.7rem] h-[1.7rem] rounded-md opacity-90" />
            </div>
            <div className="flex flex-col justify-center w-[90%] pl-1.5 mt-1">
              <p className="text-slate-300/90 max-w-[97%] whitespace-nowrap overflow-hidden text-ellipsis">
                {tab.title}
              </p>
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
          </motion.div>
        ))}

        {/* no snoozed tabs */}
        {snoozedTabs?.length < 1 ? (
          <p className="text-slate-500 text-[14px] py-8 font-light my-auto mx-auto w-fit">
            No snoozed tabs for this space
          </p>
        ) : null}
      </div>
    </SlideModal>
  );
};

export default SnoozedTabs;
