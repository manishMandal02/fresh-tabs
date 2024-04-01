import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { useState } from 'react';
import Popover from '../popover';

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
          className={`select-none rounded-md !h-full !w-full  flex items-center justify-center 
                        transition-all duration-200 ${size === 'md' ? 'text-[18px]' : 'text-[15px]'}  `}>
          <div className="">{emoji}</div>
        </button>
      </Popover>
    </div>
  );
};

export default EmojiPicker;
