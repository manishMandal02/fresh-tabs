import { CSSClasses } from '@root/src/types/global.types';
import { cn } from '@root/src/utils';
import type { ChangeEventHandler } from 'react';

type Props = {
  id?: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
  classes?: CSSClasses;
};

const TextInput = ({ id, value, onChange, placeholder, classes, autoFocus = true }: Props) => {
  const onInputChange: ChangeEventHandler<HTMLInputElement> = ev => {
    console.log('🚀 ~ TextInput ~ ev:', ev);

    onChange(ev.target.value);
  };
  return (
    <input
      {...(id ? { id } : {})}
      type="text"
      tabIndex={0}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      className={cn(
        `rounded bg-brand-darkBgAccent/60 px-2.5 py-1.5 text-[14px] text-slate-300 placeholder:text-slate-500 placeholder:select-none w-full 
         outline-none border-[1.5px] border-slate-800 focus-within:border-slate-600 transition-colors duration-200`,
        classes,
      )}
      placeholder={placeholder}
      value={value}
      onChange={onInputChange}
    />
  );
};

export default TextInput;
