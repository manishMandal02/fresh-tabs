import * as SwitchRadix from '@radix-ui/react-switch';

type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  id: string;
};

const Switch = ({ id, checked, onChange }: Props) => {
  return (
    <form>
      <div className="flex items-center">
        <SwitchRadix.Root
          id={id}
          checked={checked}
          onCheckedChange={onChange}
          className={`w-[36px] h-[20px] bg-blackA6 rounded-full relative bg-slate-600 data-[state=checked]:bg-emerald-500 outline-none cursor-default`}>
          <SwitchRadix.Thumb
            className={`block w-[14px] h-[14px] bg-white rounded-full 
                        transition-transform duration-100 translate-x-[20%] will-change-transform data-[state=checked]:translate-x-[130%]`}
          />
        </SwitchRadix.Root>
      </div>
    </form>
  );
};

export default Switch;
