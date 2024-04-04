import { CheckIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { FC, forwardRef, PropsWithChildren } from 'react';

import { useCommand } from '../command/useCommand';
import { CommandType } from '@root/src/constants/app';
import { cn } from '@root/src/utils/cn';

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
  subCommand: CommandType;
  setSearchQuery: (query: string) => void;
  onClearSearch: () => void;
  handleFocusSearchInput: () => void;
};

const SearchBox = forwardRef<HTMLInputElement, PropsWithChildren<Props>>(
  ({ searchQuery, placeholder, subCommand, setSearchQuery, onClearSearch, handleFocusSearchInput }, ref) => {
    return (
      <div
        className={`relative w-full h-[32px] min-h-[32px] md:h-[50px] md:min-h-[50px] flex items-center bg-brand-darkBg rounded-tl-xl rounded-tr-xl
                    shadow-sm shadow-brand-darkBgAccent/60 border border-brand-darkBgAccent/70 border-collapse`}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
        <button
          className="h-full max-h-full rounded-tl-xl rounded-bl-xl outline-none"
          tabIndex={-1}
          onClick={handleFocusSearchInput}>
          {!subCommand ? (
            <MagnifyingGlassIcon className="text-slate-500/80 bg-transparent md:scale-[1.5] scale-[1] ml-[6px] mr-[4px] md:ml-3 md:mr-[9px]" />
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
            ev.nativeEvent.stopImmediatePropagation();

            setSearchQuery(ev.currentTarget.value);
          }}
          type="text"
          spellCheck={false}
          onKeyDown={ev => {
            ev.stopPropagation();
            ev.nativeEvent.stopImmediatePropagation();

            if (ev.key === 'Backspace' && !searchQuery) {
              onClearSearch();
            }

            if (ev.key.includes('ArrowDown') || ev.key.includes('ArrowUp')) {
              ev.preventDefault();
            }
          }}
          value={searchQuery}
          className={`text-[12px] md:text-[14px] text-slate-300 w-auto flex-grow px-px py-1.5 md:py-2.5  placeholder:text-slate-500/80 placeholder:font-light
                rounded-tr-xl caret-slate-300 caret rounded-br-xl outline-none border-none bg-transparent`}
        />
        {/* search filter */}
        <div className="absolute right-2 top-1.5 flex items-end ">
          <span
            className={cn(
              'flex w-fit items-center overflow-hidden text-slate-300/80 font-light bg-brand-darkBgAccent/70 mr-1 text-[10px] border border-brand-darkBgAccent px-1.5 py-px rounded-2xl select-none cursor-pointer',
            )}>
            <CheckIcon className="text-slate-200 scale-[0.7] mr-[2px]" /> Bookmarks
          </span>
          <span
            className={cn(
              'flex w-fit items-center overflow-hidden text-slate-300/80 font-light bg-brand-darkBgAccent/70 text-[10px] border border-brand-darkBgAccent px-1.5 py-px rounded-2xl select-none cursor-pointer',
            )}>
            <CheckIcon className="text-slate-200 scale-[0.7] mr-[2px]" /> Notes
          </span>
          {/* <span>Bookmarks</span> */}
        </div>
      </div>
    );
  },
);

SearchBox.displayName = 'SearchBox';

export default SearchBox;
