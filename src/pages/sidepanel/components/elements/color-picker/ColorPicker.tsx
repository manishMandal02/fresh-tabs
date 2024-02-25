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
      modalContainer
      open={isOpen}
      onChange={setIsOpen}
      content={
        <div className="px-3 py-2 rounded gap-4 flex flex-wrap items-center justify-center bg-slate-900 w-52">
          {(Object.keys(ThemeColor) as Array<ColorType>).map(key => (
            <span
              key={key}
              className="w-6 h-6 rounded-full"
              style={{
                backgroundColor: ThemeColor[key],
              }}
              onClick={() => handleColorSelect(ThemeColor[key])}
              onKeyDown={() => handleColorSelect(ThemeColor[key])}
              role="button"
              tabIndex={0}></span>
          ))}
        </div>
      }>
      <button className="border select-none border-slate-600 w-10 h-10 rounded flex items-center justify-center">
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
