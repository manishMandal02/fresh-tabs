import { ThemeColor } from '@root/src/constants/app';
import Popover from '../popover';
import { useState } from 'react';

type Props = {
  color: string;
  onChange: (color: string) => void;
};

type ColorType = keyof typeof ThemeColor;

const ColorPicker = ({ color, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleColorSelect = (selectedColor: string) => {
    onChange(selectedColor);
    setIsOpen(false);
  };

  return (
    <Popover
      open={isOpen}
      onChange={open => setIsOpen(open)}
      content={
        <div className="px-3 py-2 rounded gap-4 flex flex-wrap items-center justify-center bg-slate-900 w-52 ">
          {(Object.keys(ThemeColor) as Array<ColorType>).map(key => (
            <button
              tabIndex={0}
              key={key}
              className="w-6 h-6 rounded-full"
              style={{
                backgroundColor: ThemeColor[key],
              }}
              onClick={() => handleColorSelect(ThemeColor[key])}
              onKeyDown={ev => {
                if (ev.code === 'Enter') {
                  handleColorSelect(ThemeColor[key]);
                }
              }}></button>
          ))}
        </div>
      }>
      <button
        onClick={ev => {
          ev.stopPropagation();
          setIsOpen(true);
        }}
        className={` select-none z-50 bg-brand-darkBgAccent/50 rounded-md w-[45px] h-[40px] flex items-center justify-center hover:bg-brand-darkBgAccent/70
      transition-all duration-200 text-[20px] focus-within:bg-brand-darkBgAccent/90 focus-within:outline-brand-darkBgAccent`}>
        <div
          className="w-5 h-5 rounded-full"
          style={{
            backgroundColor: color,
          }}></div>
      </button>
    </Popover>
  );
};

export default ColorPicker;
