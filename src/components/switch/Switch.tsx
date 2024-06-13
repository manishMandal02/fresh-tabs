import * as SwitchRadix from '@radix-ui/react-switch';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
  size?: 'small' | 'medium';
};

const Switch = ({ id, checked, onChange, size = 'medium' }: Props) => {
  const switchSize =
    size === 'medium' ? 'w-[34px] h-[18px] bg-brand-darkBgAccent/90' : 'w-[22px] h-[12px] bg-brand-darkBgAccent/90';
  const thumbSize = size === 'medium' ? ' w-[14px] h-[14px] bg-slate-300' : ' w-[9px] h-[9px] bg-slate-300';
  return (
    <form>
      <div className="flex items-center">
        <SwitchRadix.Root
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className={`${switchSize} rounded-full relative  transition-all duration-200 data-[state=checked]:bg-brand-primary/75 outline-none cursor-default`}>
          <SwitchRadix.Thumb
            className={`block ${thumbSize}  rounded-full 
                        transition-transform duration-300 translate-x-[20%] will-change-transform data-[state=checked]:bg-white data-[state=checked]:translate-x-[130%]`}
          />
        </SwitchRadix.Root>
      </div>
    </form>
  );
};

export default Switch;
