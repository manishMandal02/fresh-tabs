import { ISiteVisit } from '@root/src/pages/types/global.types';
import { getSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { useState, useEffect } from 'react';
import { Tab } from '../tab';

type Props = { spaceId: string };

const SpaceHistory = ({ spaceId }: Props) => {
  const [spaceHistory, setSpaceHistory] = useState<ISiteVisit[]>([]);

  // init component
  useEffect(() => {
    (async () => {
      const fullHistory = await getSpaceHistory(spaceId, true);
      const todayHistory = await getSpaceHistory(spaceId);

      const combinedHistory = [...(fullHistory || []), ...(todayHistory || [])];

      // filter by days
      const historyByDays = combinedHistory.reduce((acc, visit) => {
        const date = new Date(visit.timestamp).toLocaleDateString();

        if (!acc[date]) {
          acc[date] = [];
        }

        acc[date].push(visit);

        return acc;
      });

      console.log('🚀 ~ historyByDays ~ historyByDays:', historyByDays);

      setSpaceHistory(combinedHistory);
    })();
  }, [spaceId]);

  return (
    <div className="py-1 text-slate-400 text-center">
      {spaceHistory?.map(visit => (
        <div key={visit.timestamp}>
          <Tab
            tabData={{ url: visit.url, title: visit.title, id: 0 }}
            isTabActive={false}
            isSpaceActive={false}
            isModifierKeyPressed={false}
            showHoverOption={true}
            showDeleteOption={false}
          />
        </div>
      ))}

      {/* no history tabs */}
      {spaceHistory?.length < 1 ? (
        <p className="text-slate-500 text-[14px] font-light mt-6 mx-auto">No history for this space</p>
      ) : null}
    </div>
  );
};

export default SpaceHistory;
