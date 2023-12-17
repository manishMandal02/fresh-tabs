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
        onChange={setIsOpen}
        content={
          <div className="z-150">
            <EmojiPickerReact
              onEmojiClick={data => {
                onChange(data.emoji);
                setIsOpen(false);
              }}
              height={'400px'}
              width={'350px'}
              theme={Theme.DARK}
            />
          </div>
        }>
        <button className="border border-slate-600 rounded px-2 py-1 text-xl" onClick={() => setIsOpen(true)}>
          {emoji}
        </button>
      </Popover>
    </div>
  );
};

export default EmojiPicker;
