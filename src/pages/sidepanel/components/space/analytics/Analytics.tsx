import { Cross1Icon } from '@radix-ui/react-icons';
import PieChart from '../../elements/charts/PieChart';
import { ThemeColor } from '@root/src/constants/app';

const sampleData = [
  { label: '☘️', value: 350, color: ThemeColor.Teal },
  { label: '💼', value: 60, color: ThemeColor.Indigo },
  { label: '🧑‍💻', value: 120, color: ThemeColor.Purple },
  { label: '🚀', value: 80, color: ThemeColor.Yellow },
];

type Props = {
  show: boolean;
  onClose: () => void;
};
const Analytics = ({ show, onClose }: Props) => {
  return show ? (
    <div className="absolute bottom-0 left-0 w-full h-[86.5%] bg-brand-darkBg rounded-tl-xl rounded-tr-xl z-[9999] border-t border-brand-darkBgAccent/80">
      {/* header */}
      <div className="w-full px-3 py-2 flex items-center justify-between border-b border-brand-darkBgAccent/30">
        <span></span>
        <p className="text-slate-400/90  font-light text-[16px]">Space Usage Analytics</p>
        <Cross1Icon className="text-slate-600 font-bold scale-[1.1]" onClick={onClose} />
      </div>
      {/* main */}
      <main>
        <PieChart data={sampleData} />
      </main>
    </div>
  ) : null;
};

export default Analytics;
