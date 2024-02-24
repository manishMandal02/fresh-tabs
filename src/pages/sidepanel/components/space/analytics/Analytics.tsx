import PieChart, { PieChartData } from '../../elements/charts/PieChart';
import { useState, useEffect } from 'react';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import DatePicker from '../../elements/date-picker/DatePicker';
import { useKeyPressed } from '../../../hooks/useKeyPressed';
import { SlideModal } from '../../elements/modal';

const filterOptions = ['Today', 'Yesterday', '7 days', '30 days', 'Custom', 'All'];

type Props = {
  show: boolean;
  onClose: () => void;
};

const getRandomNum = () => Math.round(Math.random() * 12 * (Math.random() * 15) * 2);

const Analytics = ({ show, onClose }: Props) => {
  const [selectedFilter, setSelectedFilter] = useState(0);

  const [customDate, setCustomDate] = useState<Date | null>();

  const [spaceUsageData, setSpaceUsageData] = useState<PieChartData[]>([]);

  useEffect(() => {
    if (filterOptions[selectedFilter] === 'Custom') {
      setCustomDate(new Date());
    }
  }, [selectedFilter]);

  useEffect(() => {
    (async () => {
      const spaces = await getAllSpaces();

      // TODO - get usage data

      setSpaceUsageData([
        ...spaces.map(s => ({
          color: s.theme,
          icon: s.emoji,
          label: s.title,
          value: getRandomNum(),
        })),
      ]);
    })();
  }, []);

  useKeyPressed({
    onEscapePressed: () => {
      onClose();
    },
  });

  return (
    <SlideModal isOpen={show} onClose={onClose} title="Space Usage Analytics">
      {/* main */}
      <main className="w-full pt-5 h-[65vh]">
        {/* filters */}
        <div className="flex item-center justify-between mb-1.5 px-5">
          {filterOptions.map((filter, idx) => (
            <button
              key={filter}
              className={` py-[2.5px] px-1 text-[11px] text-nowrap text-slate-400 rounded-xl transition-all duration-200 ${
                selectedFilter === idx ? 'bg-brand-darkBgAccent/60 px-3.5' : ''
              }`}
              onClick={() => setSelectedFilter(idx)}>
              {filter}
            </button>
          ))}
        </div>
        {/* custom date selector */}
        {customDate ? (
          <div className="absolute right-3 top-[14%] z-[999]">
            <DatePicker
              value={customDate}
              onChange={date => {
                setCustomDate(date || new Date());
              }}
            />
          </div>
        ) : null}
        <div className="mt-4">
          <PieChart data={spaceUsageData.toSorted((a, b) => (a.value < b.value ? 1 : -1))} />
        </div>
        {/* site usage  */}
        <div
          className={`bg-brand-darkBgAccent/30 mt-6 w-[90%] mx-auto rounded-xl h-[5rem]
                      flex items-center justify-center text-slate-500 text-[12px] font-extralight`}>
          More analytics reports coming soon...
        </div>
      </main>
    </SlideModal>
  );
};

export default Analytics;
