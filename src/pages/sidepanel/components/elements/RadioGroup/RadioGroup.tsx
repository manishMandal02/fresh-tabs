import * as RadioGroupRadix from '@radix-ui/react-radio-group';

export type RadioOptions = {
  value: string;
  label: string;
};

type Props = {
  options: RadioOptions[];
  defaultValue?: string;
  value: string;
  onChange: (value: string) => void;
};

const RadioGroup = ({ options, value, onChange, defaultValue }: Props) => {
  return (
    <form className="mt-2 ">
      <RadioGroupRadix.Root
        className="flex  gap-x-4"
        defaultValue={defaultValue}
        value={value}
        onValueChange={onChange}>
        {options.map(({ value, label }) => (
          <div key={value} className="flex items-center border border-slate-700/40  px-3 rounded-md py-1.5 w-fit ">
            <RadioGroupRadix.Item
              className="bg-slate-600 w-[18px] h-[18px] rounded-full outline-none cursor-pointer"
              value={value}
              id={value}>
              <RadioGroupRadix.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[10px] after:h-[10px] after:rounded-[50%] after:bg-emerald-400" />
            </RadioGroupRadix.Item>
            <label
              className="text-slate-300/90 text-sm leading-none pl-2.5 cursor-pointer select-text"
              htmlFor={value}
              dangerouslySetInnerHTML={{ __html: label }}>
              {label}
            </label>
          </div>
        ))}
      </RadioGroupRadix.Root>
    </form>
  );
};

export default RadioGroup;
