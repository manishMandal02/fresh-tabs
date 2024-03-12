import { SetStateAction, useAtom } from 'jotai';
import { useRef, Dispatch, useCallback, useState, useEffect } from 'react';

import EmojiPicker from '../../../elements/emoji-picker';
import { nonActiveSpacesAtom } from '@root/src/stores/app';
import { ISpace, ISpaceWithTabs } from '@root/src/pages/types/global.types';
import { getSpace, updateSpace } from '@root/src/services/chrome-storage/spaces';

type Props = {
  space: ISpace;
  setActiveSpace: Dispatch<SetStateAction<ISpaceWithTabs>>;
};

const SpaceTitle = ({ space, setActiveSpace }: Props) => {
  // spaces atom
  const [, setSpaces] = useAtom(nonActiveSpacesAtom);
  // title edit enable
  const [isTitleEditable, setIsTitleEditable] = useState(false);
  // space title (can be edited after click)
  const [spaceTitle, setSpaceTitle] = useState('');

  const spaceTitleRef = useRef<HTMLDivElement>(null);

  const handleSpaceTitleUpdate = useCallback(() => {
    if (!spaceTitle || spaceTitle.length < 3 || spaceTitle === space.title) return;

    setActiveSpace(prev => ({ ...prev, title: spaceTitle }));
    setSpaces(spaces => [...spaces.map(s => (s.id === space.id ? { ...s, title: spaceTitle } : s))]);
  }, [setSpaces, setActiveSpace, space, spaceTitle]);

  // set space title from props
  useEffect(() => {
    if (!space?.title) return;
    setSpaceTitle(space.title);
  }, [space]);

  useEffect(() => {
    if (!isTitleEditable) return;
    function handleClickOutside(event) {
      if (spaceTitleRef.current && !spaceTitleRef.current.contains(event.target)) {
        setIsTitleEditable(false);
        handleSpaceTitleUpdate();
      }
    }
    // Bind the event listener
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      // Unbind the event listener on clean up
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleSpaceTitleUpdate, spaceTitle, isTitleEditable]);

  const handleEmojiUpdate = async (emoji: string) => {
    if (emoji === space.emoji) return;
    setActiveSpace(prev => ({ ...prev, emoji }));
    setSpaces(spaces => [...spaces.map(s => (s.id === space.id ? { ...s, emoji } : s))]);
    const activeSpace = await getSpace(space.id);
    updateSpace(space.id, { ...activeSpace, emoji });
  };

  return (
    <div>
      <div className="flex items-center">
        <div
          className="size-fit rounded-[6.5px] border-[0.75px] py-[2px] px-[9px] select-none bg-gradient-to-tr from-brand-darkBg/90 to-brand-darkBgAccent/90 cursor-pointer"
          style={{ borderColor: space.theme }}>
          <EmojiPicker emoji={space.emoji} onChange={handleEmojiUpdate} size="sm" />
        </div>

        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div onClick={() => setIsTitleEditable(true)} ref={spaceTitleRef}>
          {!isTitleEditable ? (
            <p className="text-[16px] text-slate-400 font-light ml-2">{space.title}</p>
          ) : (
            <input
              value={spaceTitle}
              placeholder="Space title..."
              onKeyDown={ev => {
                if (ev.code === 'Escape') {
                  setIsTitleEditable(false);
                  setSpaceTitle(space.title);
                }
                if (ev.code === 'Enter') {
                  setIsTitleEditable(false);
                  handleSpaceTitleUpdate();
                }
              }}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              onChange={ev => setSpaceTitle(ev.currentTarget.value)}
              className={`bg-brand-darkBgAccent/50 text-slate-400 font-light text-[16px] !ml-1  py-px pl-[3px] pr-1  
                          border border-brand-darkBgAccent/60 rounded w-[85%] outline-none`}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default SpaceTitle;
