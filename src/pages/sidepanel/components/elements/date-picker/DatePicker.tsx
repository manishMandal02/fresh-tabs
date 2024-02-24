import { useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { CalendarIcon } from '@radix-ui/react-icons';
import 'react-day-picker/dist/style.css';

import Popover from '../popover';

type Props = {
  value: Date;
  onChange: (date: Date) => void;
};

const DatePicker = ({ value, onChange }: Props) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  return (
    <Popover
      open={showDatePicker}
      onChange={open => setShowDatePicker(open)}
      noContainer
      content={
        <div className="bg-brand-darkBg">
          <DayPicker
            mode="single"
            selected={value}
            onSelect={day => {
              onChange(day);
              setShowDatePicker(false);
            }}
            pagedNavigation
            className={`hover:[&_button]:!bg-brand-darkBgAccent/70 hover:[&_button]:!text-slate-300 [&_button]:!transition-all [&_button]:!duration-200  
                   [&_button]:!outline-none focus:[&_button]:!bg-brand-darkBgAccent/70 focus:[&_button]:!border-slate-500/80 text-slate-300`}
            classNames={{
              day_selected: '!bg-brand-primary !font-semibold !text-slate-700 !z-[99]',
              day_today: '!bg-brand-darkBgAccent/90 !text-slate-300 !font-semibold',
            }}
          />
        </div>
      }>
      <div className="w-fit bg-brand-darkBgAccent/40 flex items-center rounded-md px-2">
        <CalendarIcon className="text-slate-600 mr-1" />
        <button
          onClick={() => setShowDatePicker(prev => !prev)}
          tabIndex={-1}
          className="text-slate-300/90 bg-transparent z-[9999] text-[10px] w-fit px-1 py-1.5 outline-none ">
          {value.toLocaleDateString()}
        </button>
      </div>
    </Popover>
  );
};

export default DatePicker;
