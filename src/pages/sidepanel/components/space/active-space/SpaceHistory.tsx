import { ISiteVisit } from '@root/src/pages/types/global.types';
import { getSpaceHistory } from '@root/src/services/chrome-storage/space-history';
import { useState, useEffect } from 'react';
import { Tab } from '../tab';

type Props = { spaceId: string };

const SpaceHistory = ({ spaceId }: Props) => {
  const [spaceHistory, setSpaceHistory] = useState<ISiteVisit[]>([]);
  useEffect(() => {
    (async () => {
      const history = await getSpaceHistory(spaceId);
      setSpaceHistory(history);
    })();
  }, []);
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
    </div>
  );
};

export default SpaceHistory;
