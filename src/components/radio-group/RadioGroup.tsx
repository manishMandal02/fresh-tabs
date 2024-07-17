import * as RadioGroupRadix from '@radix-ui/react-radio-group';
import { cn } from '@root/src/utils/cn';

export type RadioOptions = {
  value: string;
  label: string;
};

type Props<T = string> = {
  options: RadioOptions[];
  defaultValue?: string;
  disabled?: boolean;
  value: T;
  onChange: (value: T) => void;
};

const RadioGroup = <T = string,>({ options, value, onChange, disabled, defaultValue }: Props<T>) => {
  return (
    <form className="mt-1 ">
      <RadioGroupRadix.Root
        className="flex  gap-x-4"
        defaultValue={defaultValue}
        value={value as string}
        disabled={disabled}
        onValueChange={v => onChange(v as T)}>
        {options.map(({ value: v, label }) => (
          <RadioGroupRadix.Item
            key={v}
            className={cn(
              'bg-brand-darkBg/80 w-fit py-1.5 px-2.5 flex items-center justify-center border border-brand-darkBgAccent/35 shadow-sm shadow-brand-darkBg rounded cursor-pointer disabled:cursor-not-allowed select-none',
              {
                'before:content-[""] before:block before:w-[8px] before:h-[8px] before:rounded-[50%] before:bg-brand-darkBgAccent':
                  v !== value,
              },
            )}
            value={v}
            id={v}>
            <RadioGroupRadix.Indicator
              className={`flex items-center justify-center w-full h-full relative 
                            after:content-[''] after:block after:w-[8px] after:h-[8px] after:rounded-[50%] after:bg-brand-primary/75`}
            />
            <label
              className={cn(
                'text-slate-400 text-[11px] font-light leading-none pl-2 cursor-pointer select-text text-nowrap',
                { 'cursor-not-allowed text-slate-500': disabled },
              )}
              htmlFor={v}
              dangerouslySetInnerHTML={{ __html: label }}>
              {/* {label} */}
            </label>
          </RadioGroupRadix.Item>
        ))}
      </RadioGroupRadix.Root>
    </form>
  );
};

export default RadioGroup;
