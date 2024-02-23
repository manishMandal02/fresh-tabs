// eslint-disable-next-line import/named
import { VictoryPie, VictoryLabel, LineSegment } from 'victory';
import { ThemeColor } from '@root/src/constants/app';

type ChartData = { label: string; value: number; color: ThemeColor };

type Props = {
  data: ChartData[];
};

const getTotalTime = (data: ChartData[]) => {
  const totalMinutes = data.reduce((acc, curr) => {
    return acc + curr.value;
  }, 0);
  return Number(totalMinutes / 60).toFixed(1);
};

const PieChart = ({ data }: Props) => {
  return (
    <div className="w-[60%] my-1 mx-auto flex items-center justify-between relative">
      {/* center label */}
      <span className="absolute top-1/2 left-1/2  -translate-y-1/2 -translate-x-1/2 z-[999] text-[18px] text-slate-500/90 font-medium">
        {getTotalTime(data)}
        <span className="text-[16px] ml-[0.01px]"> hrs</span>
      </span>
      <VictoryPie
        data={[...data.map(d => ({ x: d.label, y: d.value }))]}
        colorScale={[...data.map(d => d.color)]}
        cornerRadius={4}
        innerRadius={100}
        padAngle={4}
        labels={({ datum }) => `${datum.x} • ${datum.y}min`}
        labelComponent={<VictoryLabel style={{ fill: '#909090', fontSize: '26px' }} />}
        labelPlacement={'perpendicular'}
        labelPosition={'centroid'}
        labelIndicator={<LineSegment className="!stroke-slate-500/40 !stroke-[1.5] !rounded-md" />}
        animate={{
          duration: 2000,
          easing: 'circleInOut',
        }}
      />
    </div>
  );
};

export default PieChart;
