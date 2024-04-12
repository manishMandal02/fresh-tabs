import { useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import { TrashIcon } from '@radix-ui/react-icons';
import { useState, useEffect, memo } from 'react';

import { cn } from '@root/src/utils/cn';
import Tooltip from '../../../../../../components/tooltip';
import { ISnoozedTab } from '@root/src/types/global.types';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { SlideModal } from '../../../../../../components/modal';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { useCustomAnimation } from '../../../../hooks/useCustomAnimation';
import {
  getAllSpacesSnoozedTabs,
  getSnoozedTabs,
  removeSnoozedTab,
} from '@root/src/services/chrome-storage/snooze-tabs';
import { getActiveSpaceIdAtom } from '@root/src/stores/app';

const createFilterOptions = async () => {
  const allSpaces = await getAllSpaces();
  const filters = allSpaces.map(space => ({ label: `${space.emoji}  ${space.title}`, value: space.id }));

  return [{ label: 'All', value: 'all' }, ...filters];
};

type Props = {
  show: boolean;
  onClose: () => void;
};

const SnoozedTabs = ({ show, onClose }: Props) => {
  // global state
  // active space id
  const spaceId = useAtomValue(getActiveSpaceIdAtom);

  const [snoozedTabs, setSnoozedTabs] = useState<ISnoozedTab[]>([]);

  const [filterOptions, setFilterOptions] = useState<{ label: string; value: string }[]>([]);

  const [selectedFilter, setSelectedFilter] = useState<{ label: string; value: string }>(undefined);

  // init component
  useEffect(() => {
    if (!show || !spaceId) return;
    (async () => {
      // create filter options
      const filters = await createFilterOptions();

      const [activeSpaceFilter] = filters.splice(
        filters.findIndex(f => f.value === spaceId),
        1,
      );

      filters.splice(1, 0, activeSpaceFilter);

      setFilterOptions(filters);
      // set active space as selected filter
      setSelectedFilter(filters[1]);
    })();
    // run on initial mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  useEffect(() => {
    if (!selectedFilter?.value) return;

    (async () => {
      if (selectedFilter?.value === 'all') {
        const allSpacesSnoozedTabs = await getAllSpacesSnoozedTabs();
        setSnoozedTabs(allSpacesSnoozedTabs || []);
        return;
      }
      const singleSpaceSnoozedTabs = await getSnoozedTabs(selectedFilter.value);
      setSnoozedTabs(singleSpaceSnoozedTabs || []);
    })();
  }, [selectedFilter]);

  // handle delete snoozed
  const handleDeleteSnoozed = async (snoozedAt: number) => {
    setSnoozedTabs(prev => [...prev.filter(t => t.snoozedAt !== snoozedAt)]);
    await removeSnoozedTab(spaceId, snoozedAt);
  };

  const { bounce } = useCustomAnimation();

  return (
    <SlideModal isOpen={show} onClose={onClose} title={`Snoozed Tabs`}>
      <div className="px-1.5 py-1.5 min-h-[50vh] h-fit ">
        {/* filter options */}
        <div className="px-px py-1 w-full flex flex-wrap justify-center gap-x-1.5 gap-y-1 mb-2 select-none overflow-x-hidden overflow-y-auto h-fit max-h-[50px] cc-scrollbar rounded-md border border-brand-darkBgAccent/25">
          {filterOptions.map(filter => (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <span
              key={filter.value}
              onClick={() => setSelectedFilter(filter)}
              className={cn(
                'border border-brand-darkBgAccent/80 rounded-lg px-[8px] py-[2px] text-[10px] text-slate-400/90 font-light w-fit cursor-pointer transition-colors duration-300 hover:opacity-95',
                { 'bg-brand-darkBgAccent text-slate-300': selectedFilter?.value === filter?.value },
              )}>
              {filter.label}
            </span>
          ))}
        </div>
        <div className="h-fit max-h-[70vh] overflow-y-auto cc-scrollbar">
          {snoozedTabs
            .sort((a, b) => (a.snoozedUntil > b.snoozedUntil ? 1 : -1))
            ?.map(tab => (
              <motion.div
                {...bounce}
                key={tab.snoozedAt}
                className="max-w-full relative w-full flex justify-center px-2 mb-1.5 last:mb-0 bg-brand-darkBgAccent/30 rounded-lg py-1.5 group overflow-hidden">
                {/* left container */}
                <div className="w-[9%] flex items-center">
                  <img
                    src={tab.faviconUrl}
                    alt="icon"
                    className="w-[1.7rem] h-[1.7rem] rounded-md opacity-90 object-scale-down object-center"
                  />
                </div>
                {/* right */}
                <div className="flex flex-col justify-center w-[90%] pl-1.5 mt-[3.5px]">
                  <p className="text-slate-300/90 max-w-[97%] whitespace-nowrap overflow-hidden text-ellipsis">
                    {tab.title}
                  </p>
                  {/* right con.. > bottom container */}
                  <div className="text-slate-400 flex items-center justify-between mt-1.5">
                    {/* snoozed at time */}
                    <span className="text-[11px] text-slate-500/80 ml-px">snoozed {getTimeAgo(tab.snoozedAt)}</span>
                    {/* snoozed until */}
                    <span className="bg-brand-darkBgAccent/40 w-fit px-[8px] py-[1.5px] rounded-md font-medium select-none ">
                      <span className="opacity-90 text-[10px]">⏰</span> &nbsp;
                      <Tooltip label={new Date(tab.snoozedUntil).toLocaleString()}>
                        <span className="font-medium text-[10px] text-slate-400">{getTimeAgo(tab.snoozedUntil)}</span>
                      </Tooltip>
                    </span>
                  </div>
                </div>
                {/* delete */}
                <button
                  onClick={() => handleDeleteSnoozed(tab.snoozedAt)}
                  className={`translate-x-full absolute right-0 top-0 h-full w-[24px] flex items-center justify-center bg-brand-darkBgAccent/90
                           group-hover:translate-x-0 transition-all duration-[300ms] hover:bg-red-400/60 group cursor-pointer [&>svg]:hover:text-brand-darkBg`}>
                  <TrashIcon className="text-red-400 scale-[1]" />
                </button>
              </motion.div>
            ))}
        </div>

        {/* no snoozed tabs */}
        {snoozedTabs?.length < 1 ? (
          <p className="text-slate-500 text-[14px] py-8 font-light my-auto mx-auto w-fit">
            No snoozed tabs for &nbsp; {'  '}
            {selectedFilter?.label || 'this space'}
          </p>
        ) : null}
      </div>
    </SlideModal>
  );
};

export default memo(SnoozedTabs);
