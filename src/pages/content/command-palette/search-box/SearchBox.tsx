import { FC, forwardRef, PropsWithChildren } from 'react';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';

import { getCommandIcon } from '../CommandPalette';
import { CommandType } from '@root/src/constants/app';

const SEARCH_INPUT_ID = 'fresh-tab-command-palette-search-input';

// show sub command indicator instead of search icon when a sub command is selected
const SubCommandIndicator: FC<{ subCommandType?: CommandType }> = ({ subCommandType }) => {
  const { Icon, label } = getCommandIcon(subCommandType);

  return (
    <div className="flex items-center justify-start h-full border-r border-brand-darkBgAccent/50 pl-[9px] pr-[6.5px] mr-1.5 bg-brand-darkBgAccent/40">
      <Icon className=" text-slate-500/80 mr-1.5 scale-[1]" />
      <p className="text-slate-400 text-[12px]  m-0 p-0 whitespace-nowrap">{label}</p>
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
        className={`w-full h-[32px] min-h-[32px] md:h-[50px] md:min-h-[50px] flex items-center bg-brand-darkBg rounded-tl-xl rounded-tr-xl
                shadow-sm shadow-brand-darkBgAccent/60 border border-brand-darkBgAccent/70 border-collapse`}>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
        <button
          className="h-full max-h-full rounded-tl-xl rounded-bl-xl outline-none"
          tabIndex={-1}
          onClick={handleFocusSearchInput}>
          {!subCommand ? (
            <MagnifyingGlassIcon className="text-slate-600 bg-transparent md:scale-[1.5] scale-[1] ml-[6px] mr-[4px] md:ml-3 md:mr-[9px]" />
          ) : (
            <SubCommandIndicator subCommandType={subCommand} />
          )}
        </button>
        <input
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
          ref={ref}
          id={SEARCH_INPUT_ID}
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
          className={`text-[12px] md:text-[14px] text-slate-300 w-auto flex-grow px-px py-1.5 md:py-2.5  placeholder:text-slate-600 placeholder:font-light
                rounded-tr-xl caret-slate-300 caret rounded-br-xl outline-none border-none bg-transparent`}
        />
      </div>
    );
  },
);

SearchBox.displayName = 'SearchBox';

export default SearchBox;
