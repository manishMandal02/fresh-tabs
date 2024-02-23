import { ISiteVisit } from '@root/src/pages/types/global.types';
import { getSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { useState, useEffect, useRef } from 'react';
import { Tab } from '../tab';
import { motion } from 'framer-motion';
import { getISODate } from '@root/src/pages/utils/date-time/getISODate';
import { isChromeUrl } from '@root/src/pages/utils/url';
import { getWeekday } from '@root/src/pages/utils/date-time/get-weekday';
import Accordion from '../../elements/accordion/Accordion';
import { getUrlDomain } from '@root/src/pages/utils/url/get-url-domain';
import { getTime } from '@root/src/pages/utils/date-time/get-time';
import { useCustomAnimation } from '../../../hooks/useAnimation';

type GroupedVisit = { visits: ISiteVisit[]; domain?: string; faviconUrl?: string };

type HistoryByDays = {
  date: string;
  history: (GroupedVisit | ISiteVisit)[];
};

// identify same site session to group them
const isGroupSession = (visit: ISiteVisit, index: number, visits: ISiteVisit[]) => {
  console.log('🚀 ~ isGroupSession ~ index:', index);
  return (
    visits[index + 1]?.url &&
    visits[index + 1]?.url !== visit.url &&
    getUrlDomain(visit.url) === getUrlDomain(visits[index + 1]?.url)
  );
};

const getGroupedSessionRecursively = (startIndex: number, visits: ISiteVisit[]) => {
  const groupedVisits: ISiteVisit[] = [];

  let currentIndex = startIndex;

  while (
    getUrlDomain(visits[startIndex].url) === getUrlDomain(visits[currentIndex + 1].url) &&
    visits[currentIndex + 1]?.url !== visits[startIndex].url
  ) {
    groupedVisits.push(visits[currentIndex + 1]);
    currentIndex += 1;
  }

  return [visits[startIndex], ...groupedVisits];
};

type Props = { spaceId: string };

const SpaceHistory = ({ spaceId }: Props) => {
  const [spaceHistory, setSpaceHistory] = useState<HistoryByDays[]>([]);

  // date heading hint on scroll
  const [floatingDate, setFloatingDate] = useState('');

  const dateHeadingsRefs = useRef<Array<HTMLDivElement | null>>([]);

  // init component
  useEffect(() => {
    (async () => {
      const fullHistory = await getSpaceHistory(spaceId, true);
      const todayHistory = await getSpaceHistory(spaceId);

      const combinedHistory = [...(todayHistory || []), ...(fullHistory || [])];

      // const
      const historyByDays: HistoryByDays[] = [];

      // skips the below loop on index to not record grouped history twice
      const skipGroupIndexes: number[] = [];

      // filter by days
      combinedHistory.forEach((visit, idx) => {
        console.log('🚀 ~ combinedHistory.forEach ~ idx: 1st', idx);

        if (isChromeUrl(visit.url) || skipGroupIndexes.includes(idx) || visit.url === combinedHistory[idx - 1]?.url)
          return;

        const date = getISODate(new Date(visit.timestamp));
        let day = historyByDays.find(d => d.date === date);

        if (!day) {
          historyByDays.push({ date, history: [] });
          day = historyByDays.find(d => d.date === date);
        }

        if (isGroupSession(visit, idx, combinedHistory)) {
          const groupedVisits = getGroupedSessionRecursively(idx, combinedHistory);

          // skip the next site visits
          skipGroupIndexes.push(...groupedVisits.map((_g, idx1) => idx1 + idx));

          day.history.push({
            visits: groupedVisits,
            domain: getUrlDomain(visit.url),
            faviconUrl: visit.faviconUrl,
          });
        } else {
          day.history.push(visit);
        }
      });

      console.log('🚀 ~ historyByDays:', historyByDays);
      setSpaceHistory(historyByDays);
    })();
  }, [spaceId]);

  // check if date heading is hidden whiles scrolling
  const handleContainerScroll = ev => {
    const scrollTop = ev?.target?.scrollTop || 0;

    let lastDateHeadingHidden = '';

    dateHeadingsRefs.current?.forEach(dateHeading => {
      const dateHeadingTop = dateHeading.getBoundingClientRect().top;

      if (dateHeadingTop < 170 && scrollTop !== 0) {
        const date = dateHeading?.getAttribute('data-date-heading');
        if (!date) return;
        lastDateHeadingHidden = date;
      }
      setFloatingDate(lastDateHeadingHidden);
    });
  };

  useEffect(() => {
    const containerEl = document.getElementById('active-space-scrollable-container');
    if (!containerEl) return;
    containerEl.addEventListener('scroll', handleContainerScroll);

    return () => {
      containerEl.removeEventListener('scroll', handleContainerScroll);
    };
  });

  const { bounce } = useCustomAnimation();

  return (
    <div className="py-1 relative">
      {/* date info while scrolling */}
      {floatingDate ? (
        <div className="sticky  top-10 left-1/2 -translate-x-1/2 flex items-center justify-center  text-[11px] w-fit h-5 bg-brand-darkBg shadow-md shadow-brand-darkBgAccent/40 border border-brand-darkBgAccent/60 px-5 py-1.5 rounded-xl z-[99] text-slate-300/80">
          {getWeekday(new Date(floatingDate))}{' '}
          {new Date(floatingDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: '2-digit' })}
        </div>
      ) : null}

      {spaceHistory?.map(({ date, history }, index) => (
        <motion.div key={date} className="max-w-[99%]" {...bounce}>
          <Accordion
            id={date}
            trigger={
              // history date heading
              <div
                ref={el => (dateHeadingsRefs.current[index] = el)}
                data-date-heading={date}
                className="text-[13px] sticky top-0  w-[98%] flex items-center justify-between rounded-md  text-left mb-[2px]  text-slate-300   py-2 px-2.5">
                <p>
                  {getISODate(date) === getISODate(new Date()) ? 'Today •' : ''} {'  '} {getWeekday(new Date(date))}
                  {'  '}
                  {new Date(date).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: '2-digit' })}
                </p>
              </div>
            }>
            {/* date's history */}
            <div className="px-px bg-brand-darkBgAccent/5 py-1 rounded-md ">
              {history.map(data => {
                if ((data as GroupedVisit)?.domain) {
                  const visit = data as GroupedVisit;
                  return (
                    <div key={visit.domain + visit.visits?.length || 0} className="rounded-md my-px">
                      {/* group title (domain) */}
                      <Accordion
                        id={visit.domain}
                        defaultCollapsed
                        trigger={
                          <div className="flex items-center py-[5px] m-0 -ml-px">
                            {/* time */}
                            <span className="text-slate-500/80 text-[10px] mr-1.5">
                              {getTime(visit.visits[0]?.timestamp)}
                            </span>

                            {/* icon & title */}
                            <img alt="icon" src={visit.faviconUrl} className="w-[14px] h-[14px] mr-2" />
                            <p className="text-slate-400/80">
                              {visit.domain} ({visit.visits.length}) &nbsp;{' '}
                            </p>
                          </div>
                        }>
                        <div className="bg-brand-darkBgAccent/20">
                          {visit.visits.map(v => (
                            <div key={v.timestamp}>
                              <Tab
                                tabData={{ url: v.url, title: v.title, id: 0 }}
                                isTabActive={false}
                                isSpaceActive={false}
                                isModifierKeyPressed={false}
                                showHoverOption={true}
                                showDeleteOption={false}
                              />
                            </div>
                          ))}
                        </div>
                      </Accordion>
                    </div>
                  );
                } else {
                  const visit = data as ISiteVisit;
                  return (
                    <div key={visit.timestamp} className="flex items-center mb-px">
                      <span className="text-slate-500/80 text-[10px] pl-1 mr-[0.5px]">{getTime(visit.timestamp)}</span>
                      <Tab
                        tabData={{ url: visit.url, title: visit.title, id: 0 }}
                        isTabActive={false}
                        isSpaceActive={false}
                        isModifierKeyPressed={false}
                        showHoverOption={true}
                        showDeleteOption={false}
                      />
                    </div>
                  );
                }
              })}
            </div>
          </Accordion>
        </motion.div>
      ))}

      {/* no history tabs */}
      {spaceHistory?.length < 1 ? (
        <p className="text-slate-500 text-[14px] font-light mt-6 mx-auto">No history for this space</p>
      ) : null}
    </div>
  );
};

export default SpaceHistory;
