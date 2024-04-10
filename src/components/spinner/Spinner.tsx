import { cn } from '@root/src/utils/cn';

type Props = {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
};

const Spinner = ({ size = 'md', color = '#ebebeb' }: Props) => {
  const getBorderSize = () => (size === 'sm' ? '2.5px' : size === 'md' ? '5px' : '8px');

  return (
    <div className="flex w-full h-full items-center justify-center relative">
      <div
        className={cn('animate-spin  rounded-full border-2.5! border-slate-500! relative', {
          'size-6': size === 'sm',
          'size-8': size === 'md',
          'size-12': size === 'lg',
        })}
        style={{
          border: `${getBorderSize()} solid #303843`,
          borderTopColor: color,
        }}></div>
    </div>
  );
};

export default Spinner;
