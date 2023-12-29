import * as RadioGroupRadix from '@radix-ui/react-radio-group';

export type RadioOptions = {
  value: string;
  label: string;
};

type Props<T = string> = {
  options: RadioOptions[];
  defaultValue?: string;
  value: T;
  onChange: (value: T) => void;
};

const RadioGroup = <T = string,>({ options, value, onChange, defaultValue }: Props<T>) => {
  return (
    <form className="mt-1 ">
      <RadioGroupRadix.Root
        className="flex  gap-x-4"
        defaultValue={defaultValue}
        value={value as string}
        onValueChange={value => onChange(value as T)}>
        {options.map(({ value, label }) => (
          <div key={value} className="flex items-center border border-slate-700/40  px-3 rounded-md py-1.5 w-fit ">
            <RadioGroupRadix.Item
              className="bg-slate-600 w-[16px] h-[16px] rounded-full outline-none cursor-pointer"
              value={value}
              id={value}>
              <RadioGroupRadix.Indicator className="flex items-center justify-center w-full h-full relative after:content-[''] after:block after:w-[8px] after:h-[8px] after:rounded-[50%] after:bg-emerald-400" />
            </RadioGroupRadix.Item>
            <label
              className="text-slate-300/90 text-[12px] leading-none pl-2.5 cursor-pointer select-text"
              htmlFor={value}
              dangerouslySetInnerHTML={{ __html: label }}>
              {/* {label} */}
            </label>
          </div>
        ))}
      </RadioGroupRadix.Root>
    </form>
  );
};

export default RadioGroup;
