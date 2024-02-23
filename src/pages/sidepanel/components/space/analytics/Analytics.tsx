import { Cross1Icon } from '@radix-ui/react-icons';
import PieChart, { PieChartData } from '../../elements/charts/PieChart';
import { useState, useEffect } from 'react';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';

const filterOptions = ['Today', 'Yesterday', '7 days', '30 days', 'All'];

type Props = {
  show: boolean;
  onClose: () => void;
};
const Analytics = ({ show, onClose }: Props) => {
  const [selectedFilter, setSelectedFilter] = useState(0);

  const [spaceUsageData, setSpaceUsageData] = useState<PieChartData[]>([]);

  useEffect(() => {
    (async () => {
      const spaces = await getAllSpaces();

      setSpaceUsageData([
        ...spaces.map(s => ({
          color: s.theme,
          icon: s.emoji,
          label: s.title,
          value: Math.round(Math.random() * 12 * (Math.random() * 15) * 2),
        })),
      ]);
    })();
  }, []);

  return show ? (
    <div className="absolute bottom-0 left-0 w-full h-[86.5%] bg-brand-darkBg rounded-tl-xl rounded-tr-xl z-[9999] border-t border-brand-darkBgAccent/80">
      {/* header */}
      <div className="w-full px-3 py-2 flex items-center justify-between border-b border-brand-darkBgAccent/30">
        <span></span>
        <p className="text-slate-400/80 text-[14px]">Space Usage Analytics</p>
        <Cross1Icon className="text-slate-600 font-bold scale-[1.1]" onClick={onClose} />
      </div>
      {/* main */}
      <main className="w-full pt-2">
        {/* filters */}
        <div className="flex item-center justify-around mb-1.5 mx-4">
          {filterOptions.map((filter, idx) => (
            <button
              key={filter}
              className={`px-3.5 py-[2.5px] text-[12px] text-nowrap text-slate-400 rounded-xl transition-all duration-200 ${
                selectedFilter === idx ? 'bg-brand-darkBgAccent/60' : ''
              }`}
              onClick={() => setSelectedFilter(idx)}>
              {filter}
            </button>
          ))}
        </div>
        <PieChart data={spaceUsageData.toSorted((a, b) => (a.value < b.value ? 1 : -1))} />
      </main>
    </div>
  ) : null;
};

export default Analytics;
