import { useState } from 'react';
import EmojiPickerReact, { Theme } from 'emoji-picker-react';

import Popover from '../popover';
import { cn } from '@root/src/utils/cn';

type Props = {
  onChange: (emoji: string) => void;
  emoji: string;
  size?: 'sm' | 'md';
};

const EmojiPicker = ({ emoji, onChange, size = 'md' }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <Popover
        open={isOpen}
        onChange={open => setIsOpen(open)}
        content={
          // eslint-disable-next-line jsx-a11y/no-static-element-interactions
          <div className="relative" onKeyDown={ev => ev.stopPropagation()} onClick={ev => ev.stopPropagation()}>
            <EmojiPickerReact
              onEmojiClick={data => {
                onChange(data.emoji);
                setIsOpen(false);
              }}
              height={'400px'}
              width={'350px'}
              theme={Theme.DARK}
              lazyLoadEmojis
              autoFocusSearch
              className="!bg-brand-darkBg !shadow !shadow-slate-500 [&_input]:!bg-brand-darkBgAccent/80 [&_li>h2]:!bg-brand-darkBgAccent/60"
            />
          </div>
        }>
        <button
          tabIndex={-1}
          onClick={() => setIsOpen(true)}
          className={cn(
            'select-none rounded !h-full !w-full text-slate-200 flex items-center justify-center bg-brand-darkBgAccent/60 transition-all duration-200',
            { 'text-[18px]': size === 'md' },
            { 'text-[15px]': size === 'sm' },
          )}>
          <div className="">{emoji}</div>
        </button>
      </Popover>
    </div>
  );
};

export default EmojiPicker;
