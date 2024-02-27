import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { useState } from 'react';
import Popover from '../popover';

type Props = {
  onChange: (emoji: string) => void;
  emoji: string;
};

const EmojiPicker = ({ emoji, onChange }: Props) => {
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
          onClick={() => setIsOpen(true)}
          className={` select-none  bg-brand-darkBgAccent/50 rounded-md w-[45px] h-[40px] flex items-center justify-center hover:bg-brand-darkBgAccent/70
                        transition-all duration-200 text-[20px] focus-within:bg-brand-darkBgAccent/90 focus-within:outline-brand-darkBgAccent`}>
          <div className="">{emoji}</div>
        </button>
      </Popover>
    </div>
  );
};

export default EmojiPicker;
