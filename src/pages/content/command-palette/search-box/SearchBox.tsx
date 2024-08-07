import { motion } from 'framer-motion';
import { CheckIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { FC, forwardRef, PropsWithChildren, Dispatch, memo } from 'react';

import { cn } from '@root/src/utils/cn';
import { useCommand } from '../command/useCommand';
import { CommandType } from '@root/src/constants/app';
import { ISearchFilters } from '@root/src/types/global.types';

// show sub command indicator instead of search icon when a sub command is selected
const SubCommandIndicator: FC<{ subCommandType?: CommandType }> = ({ subCommandType }) => {
  const { getCommandIcon } = useCommand();
  const { Icon, label } = getCommandIcon(subCommandType);

  return (
    <div className="flex items-center justify-start h-full border-r border-brand-darkBgAccent/60 pl-[9px] pr-[6.5px] mr-1.5 rounded-tl-xl bg-brand-darkBgAccent/40">
      <Icon className=" text-slate-400 mr-1.5 scale-[1]" />
      <p className="text-slate-400/80   text-[12px] font-medium  m-0 p-0 whitespace-nowrap">{label}</p>
    </div>
  );
};

type Props = {
  searchQuery: string;
  placeholder: string;
  isNotesDisabled: boolean;
  subCommand: CommandType;
  setSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  handleFocusSearchInput: () => void;
  searchFilters: ISearchFilters;
  setSearchFilters: Dispatch<React.SetStateAction<ISearchFilters>>;
};

const SearchBox = forwardRef<HTMLInputElement, PropsWithChildren<Props>>(
  (
    {
      subCommand,
      placeholder,
      searchQuery,
      onClearSearch,
      searchFilters,
      setSearchQuery,
      isNotesDisabled,
      setSearchFilters,
      handleFocusSearchInput,
    },
    ref,
  ) => {
    console.log('SearchBox ~ 🔁 rendered');

    const { searchBookmarks, searchNotes } = searchFilters;

    return (
      <div
        className={`relative w-full h-[50px] min-h-[50px] flex items-center bg-brand-darkBg rounded-tl-xl rounded-tr-xl
                    shadow-sm shadow-brand-darkBgAccent/60 border border-brand-darkBgAccent/70 border-collapse`}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
        <button
          className="h-full max-h-full rounded-tl-xl rounded-bl-xl outline-none"
          tabIndex={-1}
          onClick={handleFocusSearchInput}>
          {!subCommand ? (
            <MagnifyingGlassIcon className="text-slate-500/80 bg-transparent scale-[1.5] ml-3 mr-[9px]" />
          ) : (
            <SubCommandIndicator subCommandType={subCommand} />
          )}
        </button>
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          ref={ref}
          placeholder={placeholder}
          onChange={ev => {
            setSearchQuery(ev.currentTarget.value);
          }}
          type="text"
          spellCheck={false}
          onKeyDown={ev => {
            if (ev.key === 'Backspace' && !searchQuery) {
              onClearSearch();
            }

            if (ev.key.includes('ArrowDown') || ev.key.includes('ArrowUp')) {
              ev.preventDefault();
            }
          }}
          value={searchQuery}
          className={`text-[14px] text-slate-300 w-auto flex-grow px-px py-2.5  placeholder:text-slate-500/80 placeholder:font-light
                rounded-tr-xl caret-slate-300 caret rounded-br-xl outline-none border-none bg-transparent`}
        />
        {/* search filter */}
        <div className="absolute right-2 top-1.5 flex items-end">
          {/* bookmark */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <motion.div
            whileTap={{ scale: '1.1', width: '100%' }}
            transition={{ type: 'spring', duration: '0.1', damping: 15, stiffness: 250 }}
            tabIndex={-1}
            onClick={() => {
              setSearchFilters(prev => ({ ...prev, searchBookmarks: !prev.searchBookmarks }));
              handleFocusSearchInput();
            }}
            className={cn(
              'flex w-[84px] items-center justify-center overflow-hidden text-slate-300/70 font-light mr-1 text-[10.5px] border border-brand-darkBgAccent/90 px-2.5 py-px rounded-2xl select-none cursor-pointer',
              { 'bg-brand-darkBgAccent/70 px-1.5': searchBookmarks },
            )}>
            <span className="mr-[2px]">
              {searchBookmarks ? <CheckIcon className="text-slate-200 scale-[0.7] " /> : null}
            </span>
            Bookmarks
          </motion.div>
          {/* notes */}
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          {!isNotesDisabled ? (
            <motion.span
              whileTap={{ scale: '1.1', width: '100%' }}
              transition={{ type: 'spring', duration: '0.1', damping: 15, stiffness: 200 }}
              tabIndex={-1}
              onClick={() => {
                setSearchFilters(prev => ({ ...prev, searchNotes: !prev.searchNotes }));
                handleFocusSearchInput();
              }}
              className={cn(
                'flex w-[60px] items-center justify-center overflow-hidden text-slate-300/70 font-light text-[10.5px] border border-brand-darkBgAccent/90 px-2.5 py-px rounded-2xl select-none cursor-pointer',
                { 'bg-brand-darkBgAccent/70 px-1.5': searchNotes },
              )}>
              <span className="mr-[2px]">
                {searchNotes ? <CheckIcon className="text-slate-200 scale-[0.7]" /> : null}
              </span>
              Notes
            </motion.span>
          ) : null}
          {/* <span>Bookmarks</span> */}
        </div>
      </div>
    );
  },
);

SearchBox.displayName = 'SearchBox';

export default memo(SearchBox);
