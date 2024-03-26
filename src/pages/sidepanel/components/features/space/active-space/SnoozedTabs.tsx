import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import Tooltip from '../../../elements/tooltip';
import { ISnoozedTab } from '@root/src/pages/types/global.types';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import { getTimeAgo } from '@root/src/pages/utils/date-time/time-ago';
import { getSnoozedTabs } from '@root/src/services/chrome-storage/snooze-tabs';
import { SlideModal } from '../../../elements/modal';
import { useAtom } from 'jotai';
import { activeSpaceIdAtom } from '@root/src/stores/app';

type Props = {
  show: boolean;
  onClose: () => void;
};

const SnoozedTabs = ({ show, onClose }: Props) => {
  // global state
  // active space id
  const [spaceId] = useAtom(activeSpaceIdAtom);

  const [snoozedTabs, setSnoozedTabs] = useState<ISnoozedTab[]>([]);

  useEffect(() => {
    if (!show || !spaceId) return;
    (async () => {
      const snoozedTabsStorage = await getSnoozedTabs(spaceId);
      setSnoozedTabs(snoozedTabsStorage || []);
    })();
  }, [show, spaceId]);

  // TODO - handle delete snoozed

  // TODO - show filter options as all space snoozed tabs, etc.

  const { bounce } = useCustomAnimation();

  return (
    <SlideModal isOpen={show} onClose={onClose} title={`Snoozed Tabs (${snoozedTabs?.length || 0})`}>
      <div className="px-1.5 py-1.5 min-h-[40vh] max-h-[80vh]">
        {snoozedTabs?.map(tab => (
          <motion.div
            {...bounce}
            key={tab.snoozedAt}
            className="max-w-full w-full flex justify-center px-2 mb-1.5 last:mb-0 bg-brand-darkBgAccent/30 rounded-lg py-1.5 ">
            {/* left container */}
            <div className="w-[9%] flex items-center">
              <img src={tab.faviconUrl} alt="icon" className="w-[1.7rem] h-[1.7rem] rounded-md opacity-90" />
            </div>
            {/* right */}
            <div className="flex flex-col justify-center w-[90%] pl-1.5 mt-[3.5px]">
              <p className="text-slate-300/90 max-w-[97%] whitespace-nowrap overflow-hidden text-ellipsis">
                {tab.title}
              </p>
              {/* right con.. > bottom container */}
              <div className="text-slate-400 flex items-center justify-between mt-1">
                {/* snoozed at time */}
                <span className="text-[11px] text-slate-500 ml-px">snoozed {getTimeAgo(tab.snoozedAt)}</span>
                {/* snoozed until */}
                <span className=" bg-brand-darkBg/70 w-fit px-[9px] py-[1.5px] rounded font-medium mr-2.5 -mb-px select-none ">
                  <span className="opacity-90">⏰</span> &nbsp;
                  <Tooltip label={new Date(tab.snoozedUntil).toLocaleString()}>
                    <span className="font-medium text-[11px] text-slate-300/70">{getTimeAgo(tab.snoozedUntil)}</span>
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
