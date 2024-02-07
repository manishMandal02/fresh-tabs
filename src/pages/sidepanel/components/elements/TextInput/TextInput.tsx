import type { ChangeEventHandler } from 'react';

type Props = {
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
};

const TextInput = ({ value, onChange, placeholder }: Props) => {
  const onInputChange: ChangeEventHandler<HTMLInputElement> = ev => {
    onChange(ev.target.value);
  };
  return (
    <input
      type="text"
      className="rounded bg-brand-darkBgAccent  px-2.5 py-1.5 text-[1rem]  text-slate-200 w-48 outline-slate-700 border-none"
      placeholder={placeholder}
      // onKeyDown={ev => {
      //   ev.stopPropagation();
      // }}
      value={value}
      onChange={onInputChange}
    />
  );
};

export default TextInput;
