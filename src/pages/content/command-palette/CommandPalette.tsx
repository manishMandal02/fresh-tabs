import { motion } from 'framer-motion';
import { MdOutlineKeyboardReturn } from 'react-icons/md';
import { useState, useEffect, useRef, MouseEventHandler, useCallback } from 'react';
import {
  ArrowUpIcon,
  MagnifyingGlassIcon,
  ClockIcon,
  FileTextIcon,
  EnterIcon,
  PinRightIcon,
  MoonIcon,
  MoveIcon,
  DesktopIcon,
  Cross1Icon,
} from '@radix-ui/react-icons';

import Command from './command/Command';
import { debounce } from '../../../utils/debounce';
import { getFaviconURL } from '../../../utils/url';
import { CommandType } from '@root/src/constants/app';
import { useCommandPalette } from './useCommandPalette';
import { publishEvents } from '../../../utils/publish-events';
import CommandSectionLabel from './command/CommandSectionLabel';
import { ICommand, ISpace, ITab } from '../../types/global.types';
import { prettifyDate } from '../../../utils/date-time/prettifyDate';
import { useCustomAnimation } from '../../sidepanel/hooks/useAnimation';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { naturalLanguageToDate } from '../../../utils/date-time/naturalLanguageToDate';
import SearchBox from './search-box/SearchBox';
import CreateNote from './create-note';

// default static commands
export const staticCommands: ICommand[] = [
  { index: 1, type: CommandType.SwitchTab, label: 'Switch Tab', icon: PinRightIcon },
  { index: 2, type: CommandType.NewNote, label: 'New Note', icon: FileTextIcon },
  { index: 3, type: CommandType.SwitchSpace, label: 'Switch Space', icon: EnterIcon },
  { index: 4, type: CommandType.NewSpace, label: 'New Space', icon: DesktopIcon },
  { index: 5, type: CommandType.AddToSpace, label: 'Move Tab', icon: MoveIcon },
  { index: 6, type: CommandType.SnoozeTab, label: 'Snooze Tab', icon: ClockIcon },
  { index: 7, type: CommandType.DiscardTabs, label: 'Discard Tabs', icon: MoonIcon },
  // TODO - add handler
  { index: 8, type: CommandType.CloseTab, label: 'Close Tab', icon: Cross1Icon },
];

const isStaticCommands = (label: string) => staticCommands.some(cmd => cmd.label === label);

export const getCommandIcon = (type: CommandType) => {
  const cmd = staticCommands.find(c => c.type === type);

  return { Icon: cmd.icon, label: cmd.label };
};

const webSearchCommand = (query: string, index: number) => {
  return {
    index,
    label: `Web Search: <b className="text-slate-300">${query}</b>`,
    type: CommandType.WebSearch,
    icon: MagnifyingGlassIcon,
  };
};

export const COMMAND_HEIGHT = 30;

const SUGGESTED_COMMANDS_MAX_HEIGHT = 400;

type Props = {
  activeSpace: ISpace;
  recentSites: ITab[];
  onClose?: () => void;
  isSidePanel?: boolean;
  userSelectedText?: string;
};

// TODO - Fix - when typing fast and selecting command that opens sub commands, the sub command assumes that theres text in the input box while there isn't any.
// its' because of the multi useEffect  updating the commands/search
// 👆 this is also causing another bug where the search box is empty but the suggestion box assumes that there's still some part of the erase text

const CommandPalette = ({ activeSpace, recentSites, onClose, userSelectedText, isSidePanel = false }: Props) => {
  // loading search result
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // elements ref
  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  const {
    handleSelectCommand,
    searchQueryPlaceholder,
    setSubCommand,
    subCommand,
    suggestedCommands,
    suggestedCommandsForSubCommand,
    setSuggestedCommands,
    focusedCommandIndex,
    setFocusedCommandIndex,
    handleCloseCommandPalette,
    setSuggestedCommandsForSubCommand,
    searchQuery,
    setSearchQuery,
    setSearchQueryPlaceholder,
  } = useCommandPalette({ activeSpace, modalRef, onClose });

  // focus search input box
  const handleFocusSearchInput = () => {
    inputRef.current?.focus();
  };

  // check if the focused command is visible
  useEffect(() => {
    const numOfVisibleCommands = SUGGESTED_COMMANDS_MAX_HEIGHT / COMMAND_HEIGHT;

    if (focusedCommandIndex < numOfVisibleCommands && suggestionContainerRef.current?.scrollTop < 1) return;

    const focusedEl = suggestionContainerRef.current?.querySelector(`#fresh-tabs-command-${focusedCommandIndex}`);

    focusedEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusedCommandIndex, suggestedCommands]);

  // set default suggested commands
  const setDefaultSuggestedCommands = useCallback(() => {
    const recentSitesCommands = recentSites.map<ICommand>((site, idx) => ({
      index: 1 + idx + staticCommands.length,
      type: CommandType.RecentSite,
      label: site.title,
      icon: getFaviconURL(site.url, false),
      metadata: site.url,
    }));

    setSuggestedCommands([...staticCommands, ...(recentSitesCommands || [])]);
  }, [recentSites, setSuggestedCommands]);

  // initialize component
  useEffect(() => {
    modalRef.current?.showModal();
    handleFocusSearchInput();

    if (!userSelectedText) {
      setDefaultSuggestedCommands();
    } else {
      setSubCommand(CommandType.NewNote);
    }
    // run when component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userSelectedText]);

  const handleGlobalSearch = useCallback(async () => {
    const matchedCommands: ICommand[] = [];

    // query static matchedCommands label
    staticCommands
      .filter(cmd => cmd.label.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach((cmd, idx) => {
        matchedCommands.push({ ...cmd, index: idx + 1 });
      });

    // query space title
    const spaces = await getAllSpaces();

    spaces
      .filter(s => s.id !== activeSpace.id && s.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach(space => {
        matchedCommands.push({
          index: matchedCommands.length + 1,
          type: CommandType.SwitchSpace,
          label: space.title,
          icon: space.emoji,
          metadata: space.id,
        });
      });

    // query current tab url/title (words match)
    let tabs = await getTabsInSpace(activeSpace.id);

    if (tabs?.length > 0) {
      tabs = tabs.filter(tab => tab.title.toLowerCase().includes(searchQuery.toLowerCase()));

      tabs.forEach(tab => {
        matchedCommands.push({
          index: matchedCommands.length + 1,
          type: CommandType.SwitchTab,
          label: tab.title,
          icon: getFaviconURL(tab.url, false),
          metadata: tab.id,
        });
      });
    }

    matchedCommands.push(webSearchCommand(searchQuery, matchedCommands.length + 1));

    setSuggestedCommands(matchedCommands);

    const res = await publishEvents<ICommand[]>({ event: 'SEARCH', payload: { searchQuery } });

    if (res?.length > 0) {
      const resMatchedCommands: ICommand[] = [];
      res.forEach((cmd, idx) => {
        resMatchedCommands.push({
          ...cmd,
          index: idx + matchedCommands.length + 1,
        });
      });
      setSuggestedCommands(prev => [...prev, ...resMatchedCommands]);
    }

    setIsLoadingResults(false);

    setFocusedCommandIndex(1);
  }, [setSuggestedCommands, setFocusedCommandIndex, activeSpace, searchQuery]);

  // on global search
  useEffect(() => {
    if (subCommand === CommandType.NewNote) {
      // do nothing if subCommand is new note (taking a new)
      // clear command suggestions
      setSuggestedCommands([]);
      return;
    }

    if (searchQuery.trim() && !subCommand) {
      setIsLoadingResults(true);
      // debounce search
      debounce(handleGlobalSearch)();
    } else if (!searchQuery.trim() && !subCommand) {
      // reset search
      setDefaultSuggestedCommands();
      setSearchQueryPlaceholder('Search...');
      setFocusedCommandIndex(1);
    }
  }, [
    searchQuery,
    handleGlobalSearch,
    setFocusedCommandIndex,
    setDefaultSuggestedCommands,
    subCommand,
    setSearchQueryPlaceholder,
  ]);

  // on search for sub command
  useEffect(() => {
    if (subCommand && searchQuery && suggestedCommandsForSubCommand.length > 0) {
      // filter the suggested sub commands based on search query, also update the index
      if (subCommand === CommandType.SnoozeTab) {
        const parsedDateFromSearch = naturalLanguageToDate(searchQuery);
        if (parsedDateFromSearch) {
          const dynamicTimeCommand: ICommand = {
            index: 1,
            label: prettifyDate(parsedDateFromSearch),
            type: CommandType.SnoozeTab,
            icon: getCommandIcon(CommandType.SnoozeTab).Icon,
            metadata: parsedDateFromSearch,
          };
          setSuggestedCommands([dynamicTimeCommand]);
        } else {
          setSuggestedCommands(suggestedCommandsForSubCommand);
        }
        setFocusedCommandIndex(1);
      } else {
        const filteredSubCommands = suggestedCommandsForSubCommand
          .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((cmd, idx) => ({ ...cmd, index: idx + 1 }));
        setSuggestedCommands(filteredSubCommands);
        setFocusedCommandIndex(1);
      }
    } else if (subCommand && !searchQuery && suggestedCommandsForSubCommand.length > 0) {
      setSuggestedCommands(suggestedCommandsForSubCommand);
      setFocusedCommandIndex(1);
    }
  }, [searchQuery, subCommand, suggestedCommandsForSubCommand, setFocusedCommandIndex, setSuggestedCommands]);

  // on command select/click
  const onCommandClick = async (index: number) => {
    setFocusedCommandIndex(index);
    await handleSelectCommand();
  };

  // check if modal's backdrop was clicked
  const handleBackdropClick: MouseEventHandler<HTMLDialogElement> = ev => {
    const dialogEl = modalRef.current;

    // check if dialog was clicked or outside

    const rect = dialogEl.getBoundingClientRect();

    const isInDialog =
      rect.top <= ev.clientY &&
      ev.clientY <= rect.top + rect.height &&
      rect.left <= ev.clientX &&
      ev.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      // outside click
      handleCloseCommandPalette();
    }
  };

  const { bounce } = useCustomAnimation();

  return (
    <div className="w-screen h-screen flex items-center justify-center fixed top-0 left-0 overflow-hidden">
      <motion.dialog
        aria-modal
        tabIndex={-1}
        ref={modalRef}
        onClick={handleBackdropClick}
        onKeyDown={ev => {
          ev.stopPropagation();
          ev.nativeEvent.stopImmediatePropagation();
        }}
        {...bounce}
        className={`mx-auto top-[20%] left-/12 flex items-center outline-none flex-col justify-center 
                  backdrop:to-brand-darkBg/30  h-fit min-w-[600px] w-[40%] max-w-[40%]  p-px bg-transparent`}>
        <div className="w-full h-[500px] relative overflow-visible">
          <>
            {subCommand !== CommandType.NewNote ? (
              // search box
              <SearchBox
                ref={inputRef}
                handleFocusSearchInput={handleFocusSearchInput}
                searchQuery={searchQuery}
                placeholder={searchQueryPlaceholder}
                setSearchQuery={setSearchQuery}
                subCommand={subCommand}
                onClearSearch={() => {
                  setSubCommand(null);
                  setDefaultSuggestedCommands();
                  setSuggestedCommandsForSubCommand([]);
                  setFocusedCommandIndex(1);
                }}
              />
            ) : (
              // create note
              <CreateNote userSelectedText={userSelectedText} onClose={() => handleCloseCommandPalette()} />
            )}
          </>
          {/* search suggestions and result */}
          {subCommand !== CommandType.NewNote ? (
            <div
              ref={suggestionContainerRef}
              style={{
                maxHeight: SUGGESTED_COMMANDS_MAX_HEIGHT + 'px',
              }}
              className={`bg-brand-darkBg w-full h-fit overflow-hidden overflow-y-auto cc-scrollbar cc-scrollbar mx-auto shadow-sm
                         shadow-slate-800/50 border-x  border-x-slate-600/40  border-collapse `}>
              {/* actions */}
              {suggestedCommands.length > 0 &&
                suggestedCommands?.map(cmd => {
                  const renderCommands: JSX.Element[] = [];

                  // section label
                  // do not render  for sub commands
                  !subCommand &&
                    renderCommands.push(
                      <CommandSectionLabel
                        key={cmd.index}
                        index={cmd.index}
                        isStaticCommand={isStaticCommands(cmd.label)}
                        suggestedCommands={suggestedCommands}
                      />,
                    );

                  //  command
                  renderCommands.push(
                    <Command
                      index={cmd.index}
                      label={cmd.label}
                      Icon={cmd.icon}
                      key={cmd.index}
                      isFocused={focusedCommandIndex === cmd.index}
                      onClick={() => onCommandClick(cmd.index)}
                    />,
                  );

                  // render commands & labels
                  return <>{renderCommands.map(cmd1 => cmd1)}</>;
                })}

              {/* lading commands ui (skeleton) */}
              {isLoadingResults
                ? [1, 2].map(v => (
                    <div key={v} className="w-full  mb-[5px] mt-1.5 flex items-center justify-start">
                      <span className="w-[24px] h-[25px] bg-brand-darkBgAccent/70 ml-2  rounded animate-pulse"></span>
                      <div
                        style={{ width: v % 2 !== 0 ? '40%' : '75%' }}
                        className="bg-brand-darkBgAccent/70 h-[25px] ml-2 rounded animate-pulse"></div>
                    </div>
                  ))
                : null}

              {/* no commands found */}
              {suggestedCommands.length === 0 ? (
                <div
                  className="w-full flex items-center  justify-center text-slate-500 text-sm font-light py-1"
                  style={{ height: COMMAND_HEIGHT + 'px' }}>
                  No result for {searchQuery || ''}
                </div>
              ) : null}
            </div>
          ) : null}
          {/* navigation guide */}
          {subCommand !== CommandType.NewNote ? (
            // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
            <div
              className={`bg-brand-darkBg/95 shadow-sm shadow-slate-800/70  w-full flex items-center justify-between px-1 py-px select-none
                      rounded-bl-md rounded-br-md border-t border-brand-darkBgAccent`}
              // focuses on the search input box if clicked
              onClick={handleFocusSearchInput}>
              {!isSidePanel ? (
                <div className=" text-slate-600/90 font-medium text-[10px] ml-2">FreshTabs</div>
              ) : (
                <span className="invisible"></span>
              )}
              <div className="gap-x-px  text-slate-500/80 text-[8px] flex items-center py-1">
                <span className="mr-2 flex items-center bg-brand-darkBgAccent/30 px-1.5 pt-[1px]  rounded-sm shadow-sm shadow-brand-darkBgAccent">
                  <ArrowUpIcon className="text-slate-500/80 mr-[0.5px] scale-[0.65]" />
                  <kbd>Up</kbd>
                </span>
                <span className="mr-2 flex items-center bg-brand-darkBgAccent/30 px-1.5 pt-[1px]  rounded-sm shadow-sm shadow-brand-darkBgAccent">
                  <ArrowUpIcon className="text-slate-500/80 mr-[0.5px] rotate-180 scale-[0.65]" />
                  <kbd>Down</kbd>
                </span>
                <span className="mr-2 flex items-center bg-brand-darkBgAccent/30 px-1.5 py-[1px]  rounded-sm shadow-sm shadow-brand-darkBgAccent">
                  <MdOutlineKeyboardReturn className="text-slate-500//80 mr-1 font-medium -mb-px " size={11} />
                  <kbd>Enter</kbd>
                </span>
              </div>
            </div>
          ) : null}
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
