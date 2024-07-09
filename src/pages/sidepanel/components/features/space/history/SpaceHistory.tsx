import { useAtom, useAtomValue } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, memo } from 'react';

import { Tab } from '../tab';
import { SlideModal } from '../../../../../../components/modal';
import { getActiveSpaceIdAtom, showSpaceHistoryModalAtom } from '@root/src/stores/app';
import Accordion from '../../../../../../components/accordion/Accordion';
import { ISiteVisit } from '@root/src/types/global.types';
import { getTime } from '@root/src/utils/date-time/get-time';
import { useCustomAnimation } from '../../../../hooks/useCustomAnimation';
import { getUrlDomain } from '@root/src/utils/url/get-url-domain';
import { getISODate } from '@root/src/utils/date-time/getISODate';
import { getWeekday } from '@root/src/utils/date-time/get-weekday';
import { getSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { getReadableDate } from '@root/src/utils/date-time/getReadableDate';
import SiteIcon from '@root/src/components/site-icon/SiteIcon';

type Sessions = {
  date: string;
  sessions: [string, ISiteVisit[]][];
};

// map visits by days
const mapVisitsByDays = (siteVisits: ISiteVisit[]) => {
  // Map site visits to an object with date keys
  const visitsByDate = siteVisits.reduce(
    (acc, visit, idx) => {
      // convert date to ISO format
      const dateKey = getISODate(visit.timestamp);
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }

      // check duplicate url
      if (siteVisits[Math.max(idx - 1, 0)]?.url === visit?.url) return acc;

      acc[dateKey].push(visit);

      return acc;
    },
    {} as Record<string, ISiteVisit[]>,
  );

  // Group site visits with common domain (including subdomain)
  const groupedSessions = Object.entries(visitsByDate).map(([date, visits]) => {
    const groupedVisitsMap = visits.reduce(
      (acc, visit) => {
        if (!visit?.url) return acc;

        const domain = getUrlDomain(visit.url);

        if (!acc[domain]) {
          acc[domain] = [];
        }

        acc[domain].push(visit);
        return acc;
      },
      {} as Record<string, ISiteVisit[]>,
    );
    return { date, sessions: Object.entries(groupedVisitsMap) };
  });

  return groupedSessions;
};

// * component

const SpaceHistory = () => {
  // global state
  const spaceId = useAtomValue(getActiveSpaceIdAtom);
  const [showSpaceHistoryModal, setShowSpaceHistoryModal] = useAtom(showSpaceHistoryModalAtom);

  const [spaceHistory, setSpaceHistory] = useState<Sessions[]>([]);

  // date heading hint on scroll
  const [floatingDate, setFloatingDate] = useState('');

  const dateHeadingsRefs = useRef<Array<HTMLDivElement | null>>([]);

  // init component
  useEffect(() => {
    if (!showSpaceHistoryModal) return;
    (async () => {
      const fullHistory = await getSpaceHistory(spaceId, true);
      const todayHistory = await getSpaceHistory(spaceId);

      const combinedHistory = [...(todayHistory || []), ...(fullHistory || [])];

      const sessionsByDate = mapVisitsByDays(combinedHistory);
      setSpaceHistory(sessionsByDate);
    })();
  }, [showSpaceHistoryModal, spaceId]);

  // check if date heading is hidden whiles scrolling
  const handleContainerScroll = ev => {
    const scrollTop = ev?.target?.scrollTop || 0;

    let lastDateHeadingHidden = '';

    dateHeadingsRefs.current?.forEach(dateHeading => {
      const dateHeadingTop = dateHeading.getBoundingClientRect().top;

      if (dateHeadingTop < 20 && scrollTop !== 0) {
        const date = dateHeading?.getAttribute('data-date-heading');
        if (!date) return;
        lastDateHeadingHidden = date;
      }
      setFloatingDate(lastDateHeadingHidden);
    });
  };

  // scroll event listener for main container
  useEffect(() => {
    const containerEl = document.getElementById('space-history-container');
    if (!containerEl) return;
    containerEl.addEventListener('scroll', handleContainerScroll);

    return () => {
      containerEl.removeEventListener('scroll', handleContainerScroll);
    };
  });

  const handleClose = () => {
    setShowSpaceHistoryModal(false);
  };

  const { bounce } = useCustomAnimation();

  return showSpaceHistoryModal ? (
    <SlideModal isOpen={showSpaceHistoryModal} onClose={handleClose} title={'History'}>
      <div id="space-history-container" className="max-h-[95%] cc-scrollbar min-h-fit overflow-x-hidden py-2">
        {/* date info while scrolling */}
        {floatingDate ? (
          <motion.div
            {...bounce}
            className={`z-[99] sticky top-[2.5px] mx-auto flex items-center justify-center  text-[11px] w-fit h-5  shadow-md shadow-brand-darkBgAccent/30 
                      bg-brand-darkBg border border-brand-darkBgAccent/50 px-[16px] py-[11px] rounded-xl text-slate-300/70`}>
            {getWeekday(new Date(floatingDate))} {getReadableDate(floatingDate)}
          </motion.div>
        ) : null}

        {spaceHistory?.map(({ date, sessions }, index) => (
          <div key={date} className="w-full">
            <Accordion
              id={date}
              classes={{
                triggerContainer: 'bg-brand-darkBgAccent/30 rounded mb-1 mx-[2px]',
                triggerIcon: 'text-slate-600',
              }}
              trigger={
                // history date heading
                <div
                  ref={el => (dateHeadingsRefs.current[index] = el)}
                  data-date-heading={date}
                  className="text-slate-300/90 text-[12px] font-light text-left sticky top-0  w-full max-w-[96%] flex items-center justify-between rounded-md py-2 px-2">
                  <p>
                    {getISODate(date) === getISODate(new Date()) ? 'Today •' : ''} {'  '} {getWeekday(new Date(date))}
                    {'  '}
                    {getReadableDate(date)}
                  </p>
                </div>
              }>
              {/* date's history */}
              <div className="py-px px-1">
                {sessions.map(([domain, visits]) => {
                  const sessionDomain = domain;
                  return (
                    <div key={sessionDomain} className="rounded-md my-px ">
                      {/* group title (domain) */}
                      <Accordion
                        id={sessionDomain}
                        defaultCollapsed
                        classes={{
                          triggerContainer: 'border-b border-brand-darkBgAccent/60 mb-[2px]',
                          triggerIcon: 'text-brand-darkBgAccent/90',
                        }}
                        trigger={
                          <div className="flex items-center py-[4px] m-0 -ml-px w-full max-w-[94%] ">
                            {/* time */}
                            <span className="text-slate-500/70 font-light text-[8.5px] mr-[6px]">
                              {getTime(visits[0]?.timestamp)}
                            </span>

                            {/*  icon */}
                            <SiteIcon siteURl={visits[0].url} classes="" />
                            {/*  group  domain */}
                            <div className="flex items-center w-[80%] max-w-[85%]">
                              <span className="select-text text-start text-slate-300/70 text-[11px] font-light text-ellipsis w-fit max-w-[96%] overflow-hidden whitespace-nowrap">
                                {sessionDomain}
                              </span>
                              <span className="text-[10px] text-slate-500/80 ml-[2.5px]">({visits.length})</span>
                            </div>
                          </div>
                        }>
                        <div className="bg-brand-darkBgAccent/10 py-1 pl-px pr-1">
                          {visits.map(v => (
                            <div key={v.timestamp} className="flex items-center justify-start">
                              <Tab
                                size="sm"
                                hideIcon
                                showVisitTime={getTime(v.timestamp)}
                                showURL
                                tabData={{ url: v.url, title: v.title, id: 0, index: 0, faviconUrl: '' }}
                                isSpaceActive={false}
                                showHoverOption={true}
                                showDeleteOption={false}
                              />
                            </div>
                          ))}
                        </div>
                      </Accordion>
                    </div>
                  );
                })}
              </div>
            </Accordion>
          </div>
        ))}

        {/* no history tabs */}
        {spaceHistory?.length < 1 ? (
          <p className="text-slate-500 text-[14px] font-light mt-6 mx-auto">No history for this space</p>
        ) : null}
      </div>
    </SlideModal>
  ) : (
    <></>
  );
};

export default memo(SpaceHistory);
