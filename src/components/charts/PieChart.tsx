// eslint-disable-next-line import/named
import { VictoryPie, VictoryLabel } from 'victory';

import { ThemeColor } from '@root/src/constants/app';
import { formatNumTo2Digits } from '@root/src/utils';

export type PieChartData = {
  icon: string;
  label: string;
  value: number;
  color: ThemeColor;
};

type Props = {
  data: PieChartData[];
};

const getTotalTime = (data: PieChartData[]) => {
  const totalMinutes = data.reduce((acc, curr) => {
    return acc + (curr.value as number);
  }, 0);
  return toHours(totalMinutes);
};

const toHours = (time: number) => Number(time / 60).toFixed(1);

const PieChart = ({ data }: Props) => {
  return (
    <>
      <div className="w-[60%] h-[50%] mt-2 mb-1 rounded-full mx-auto flex flex-col items-center justify-between relative select-none">
        {/* center label */}
        <span className="absolute top-1/2 left-1/2 ml-1  -translate-y-1/2 -translate-x-1/2 z-[999] text-[24px] text-slate-500/70 font-semibold">
          {getTotalTime(data)}
          <span className="text-[12px] opacity-75"> hrs</span>
        </span>
        <VictoryPie
          data={[
            ...data.map(d => ({
              x: `${d.icon} • ${formatNumTo2Digits(Number(toHours(d.value)), 1)}h`,
              y: d.value,
            })),
          ]}
          colorScale={[...data.map(d => d.color)]}
          cornerRadius={4}
          innerRadius={120}
          padAngle={3}
          labelComponent={<VictoryLabel style={{ fill: '#939393', fontSize: '24px', fontWeight: 500 }} />}
          labelPlacement={'perpendicular'}
          labelPosition={'centroid'}
          animate={{
            duration: 2000,
            easing: 'circleInOut',
          }}
        />
      </div>
      {/* chart legends (colors) */}
      <div className="mt-4 pl-4 w-full flex items-center justify-start gap-x-2 flex-wrap gap-y-2.5">
        {data.map(d => (
          <div key={d.label} className="flex items-center w-[42%] overflow-hidden">
            <div
              className="!h-[1.5rem] !w-[42px] !max-w-[42px] aspect-video px-1 flex items-center select-none justify-center text-slate-800 text-[10px] font-bold rounded mr-2"
              style={{ backgroundColor: d.color }}>
              {formatNumTo2Digits(Number(toHours(d.value)), 1)}h
            </div>
            <span className="text-slate-400 font-light mr-1">{d.icon}</span>
            <p className="text-slate-400 font-light max-w-[90%]  text-ellipsis whitespace-nowrap overflow-hidden">
              {d.label}
            </p>
          </div>
        ))}
      </div>
    </>
  );
};

export default PieChart;
