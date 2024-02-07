import EmojiPickerReact, { Theme } from 'emoji-picker-react';
import { useState } from 'react';
import Popover from '../popover';

type Props = {
  onChange: (emoji: string) => void;
  emoji: string;
};

const EmojiPicker = ({ emoji, onChange }: Props) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleOpenEmojiPicker = () => {
    setIsOpen(true);
  };

  return (
    <div>
      <Popover
        open={isOpen}
        onChange={setIsOpen}
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
          className="border select-none border-slate-600 rounded w-10 h-10 flex items-center justify-center text-xl"
          onClick={handleOpenEmojiPicker}>
          <div className="">{emoji}</div>
        </button>
      </Popover>
    </div>
  );
};

export default EmojiPicker;
