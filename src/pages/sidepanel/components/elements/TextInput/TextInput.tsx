import type { ChangeEventHandler } from 'react';

type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
  autoFocus?: boolean;
};

const TextInput = ({ value, onChange, placeholder, autoFocus = true }: Props) => {
  const onInputChange: ChangeEventHandler<HTMLInputElement> = ev => {
    onChange(ev.target.value);
  };
  return (
    <input
      type="text"
      tabIndex={0}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      className="rounded bg-brand-darkBgAccent/60 px-2.5 py-1.5 text-[14px] text-slate-300 placeholder:text-slate-500 placeholder:select-none w-[13rem] outline-none outline-offset-[2.5px] focus-within:outline-slate-700"
      placeholder={placeholder}
      value={value}
      onChange={onInputChange}
    />
  );
};

export default TextInput;
