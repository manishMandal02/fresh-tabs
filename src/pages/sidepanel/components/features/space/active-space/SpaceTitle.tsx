import { useSetAtom } from 'jotai';
import { useRef, useCallback, useState, useEffect } from 'react';

import EmojiPicker from '../../../../../../components/emoji-picker';
import { updateSpaceAtom } from '@root/src/stores/app';
import { ISpace } from '@root/src/types/global.types';
import { getSpace, updateSpace } from '@root/src/services/chrome-storage/spaces';

type Props = {
  space: ISpace;
};

const SpaceTitle = ({ space }: Props) => {
  // spaces atom
  const updateSpaceState = useSetAtom(updateSpaceAtom);
  // title edit enable
  const [isTitleEditable, setIsTitleEditable] = useState(false);
  // space title (can be edited after click)
  const [spaceTitle, setSpaceTitle] = useState('');

  const spaceTitleRef = useRef<HTMLDivElement>(null);

  const handleSpaceTitleUpdate = useCallback(async () => {
    if (!spaceTitle || spaceTitle?.length < 3 || spaceTitle === space.title) return;

    const activeSpace = await getSpace(space.id);

    updateSpaceState({ ...activeSpace, title: spaceTitle });
    updateSpace(space.id, { ...activeSpace, title: spaceTitle });
  }, [space, spaceTitle, updateSpaceState]);

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

  const handleEmojiUpdate = useCallback(
    async (emoji: string) => {
      if (emoji === space.emoji) return;

      const activeSpace = await getSpace(space.id);

      updateSpaceState({ ...activeSpace, emoji });
      updateSpace(space.id, { ...activeSpace, emoji });
    },
    [space, updateSpaceState],
  );

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
