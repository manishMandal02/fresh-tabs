import * as SwitchRadix from '@radix-ui/react-switch';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
  size?: 'small' | 'medium';
};

const Switch = ({ id, checked, onChange, size = 'medium' }: Props) => {
  const switchSize = size === 'medium' ? 'w-[36px] h-[20px] bg-slate-600' : 'w-[22px] h-[12px] bg-slate-700';
  const thumbSize = size === 'medium' ? ' w-[14px] h-[14px] bg-white' : ' w-[9px] h-[9px] bg-slate-300';
  return (
    <form>
      <div className="flex items-center">
        <SwitchRadix.Root
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className={`${switchSize} bg-blackA6 rounded-full relative  data-[state=checked]:bg-emerald-500 outline-none cursor-default`}>
          <SwitchRadix.Thumb
            className={`block ${thumbSize}  rounded-full 
                        transition-transform duration-100 translate-x-[20%] will-change-transform data-[state=checked]:translate-x-[130%]`}
          />
        </SwitchRadix.Root>
      </div>
    </form>
  );
};

export default Switch;
