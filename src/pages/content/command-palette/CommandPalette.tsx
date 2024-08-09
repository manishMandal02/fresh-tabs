import { motion } from 'framer-motion';
import { useState, useEffect, useRef, MouseEventHandler, useCallback } from 'react';

import Command from './command/Command';
import { cn } from '@root/src/utils/cn';
import CaptureNote from '../capture-note';
import { debounce, getFaviconURL, isValidURL, parseUrl } from '@root/src/utils';
import KBD from '@root/src/components/kbd/KBD';
import SearchBox from './search-box/SearchBox';
import CommandDivider from './command/CommandDivider';
import { CommandType } from '@root/src/constants/app';
import { getTime } from '@root/src/utils/date-time/get-time';
import { publishEvents } from '../../../utils/publish-events';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getAllGroups } from '@root/src/services/chrome-storage/groups';
import { getReadableDate } from '@root/src/utils/date-time/getReadableDate';
import { getAppSettings } from '@root/src/services/chrome-storage/settings';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';
import { ICommand, ISearchFilters, ISpace } from '../../../types/global.types';
import { staticCommands, useCommand, webSearchCommand } from './command/useCommand';
import { DEFAULT_SEARCH_PLACEHOLDER, useCommandPalette } from './useCommandPalette';
import { naturalLanguageToDate } from '../../../utils/date-time/naturalLanguageToDate';

const DomainWithSubdomainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,10}$/;

export const COMMAND_PALETTE_SIZE = {
  HEIGHT: 500,
  WIDTH: 600,
  MAX_HEIGHT: 500 + 100,
  MAX_WIDTH: 600 + 100,
} as const;

export const COMMAND_HEIGHT = 38;

const SEARCH_RESULT_MAX_LIMIT = 8;

const SUGGESTED_COMMANDS_MAX_HEIGHT = 400;

type Props = {
  activeSpace: ISpace;
  groupId: number;
  onClose?: () => void;
  userSelectedText?: string;
  selectedNoteId?: string;
  isOpenedInPopupWindow?: boolean;
};

// ANCHOR - Working Currently
// when typing fast and selecting command that opens sub commands, the sub command assumes that theres text in the input box while there isn't any.
// its' because of the multi useEffect  updating the commands/search
// this is also causing another bug where the search box is empty but the suggestion box assumes that there's still some part of the erase text

const CommandPalette = ({
  activeSpace,
  onClose,
  groupId,
  userSelectedText,
  selectedNoteId,
  isOpenedInPopupWindow,
}: Props) => {
  console.log('CommandPalette ~ 🔁 rendered');

  // loading search result
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const [searchFilters, setSearchFilters] = useState<ISearchFilters>({ searchBookmarks: false, searchNotes: false });

  const [isNotesDisabled, setIsNotesDisabled] = useState(false);

  const [enabledCommands, setEnabledCommands] = useState([]);

  // elements ref
  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  // focus search input box
  const handleFocusSearchInput = () => {
    inputRef.current?.focus();
  };

  const setUserPreference = async () => {
    const { cmdPalette, notes } = await getAppSettings();

    setSearchFilters({
      searchBookmarks: cmdPalette.includeBookmarksInSearch,
      searchNotes: cmdPalette.includeNotesInSearch,
    });

    const enabledCommandsFiltered = staticCommands.filter(
      cmd =>
        !cmdPalette.disabledCommands.includes(cmd.type) &&
        // exclude note cmd if notes feat disabled
        (notes.isDisabled ? cmd.type !== CommandType.NewNote : true) &&
        // exclude reading mode if reading mode not supported fot current page or if cmd palette opened in popup window
        (isOpenedInPopupWindow ? cmd.type !== CommandType.ReadingMode : true),
    );

    setIsNotesDisabled(notes.isDisabled);

    setEnabledCommands(enabledCommandsFiltered);
  };

  // initialize component
  useEffect(() => {
    modalRef.current?.showModal();
    handleFocusSearchInput();

    (async () => {
      // set user preference
      await setUserPreference();
    })();
    // run only when components renders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if ((!userSelectedText && !selectedNoteId) || isNotesDisabled) {
      // apply user preference to cmd palette

      setDefaultSuggestedCommands();
    } else {
      setSubCommand(CommandType.NewNote);
    }
  }, [enabledCommands, isNotesDisabled, userSelectedText, selectedNoteId]);

  const handleClose = useCallback(() => {
    modalRef.current?.close();
    onClose();
  }, [onClose]);

  // logic hook
  const {
    subCommand,
    searchQuery,
    setSubCommand,
    setSearchQuery,
    suggestedCommands,
    handleSelectCommand,
    focusedCommandIndex,
    setSuggestedCommands,
    searchQueryPlaceholder,
    setFocusedCommandIndex,
    handleCloseCommandPalette,
    setSearchQueryPlaceholder,
    suggestedCommandsForSubCommand,
    setSuggestedCommandsForSubCommand,
  } = useCommandPalette({
    activeSpace,
    groupId,
    isOpenedInPopupWindow,
    onClose: handleClose,
  });

  const { isStaticCommand, getCommandIcon } = useCommand();

  // check if the focused command is visible
  useEffect(() => {
    const numOfVisibleCommands = (SUGGESTED_COMMANDS_MAX_HEIGHT - 15) / COMMAND_HEIGHT;

    if (focusedCommandIndex < numOfVisibleCommands && suggestionContainerRef.current?.scrollTop < 1) return;

    const focusedEl = suggestionContainerRef.current?.querySelector(`#fresh-tabs-command-${focusedCommandIndex}`);

    focusedEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusedCommandIndex, suggestedCommands]);

  // set default suggested commands
  const setDefaultSuggestedCommands = useCallback(
    async (commands?: ICommand[]) => {
      let filteredStaticCommands = commands ? commands : enabledCommands;

      // filter out cmd (only featured and enabled commands)
      filteredStaticCommands = filteredStaticCommands.filter(cmd => !!cmd?.isFeatured);

      const currentGroups = await getAllGroups(activeSpace.id);

      if (currentGroups && currentGroups.length < 1) {
        filteredStaticCommands = filteredStaticCommands.filter(cmd => cmd.type !== CommandType.AddToGroup);
      }

      filteredStaticCommands = filteredStaticCommands.map((cmd, idx) => ({ ...cmd, index: idx + 1 }));

      setSuggestedCommands(filteredStaticCommands);
      setFocusedCommandIndex(1);
    },
    [setSuggestedCommands, setFocusedCommandIndex, activeSpace, enabledCommands],
  );

  // search sub commands
  const handleSearchSubCommands = useCallback(
    async (searchTerm: string) => {
      const searchQueryLowerCase = searchTerm.toLowerCase().trim();

      if (!searchQueryLowerCase || suggestedCommandsForSubCommand.length === 1) {
        setSuggestedCommands(suggestedCommandsForSubCommand);
        setFocusedCommandIndex(1);
        setIsLoadingResults(false);
        return;
      }

      // handle snooze sub command, generate date & time based on user input
      if (subCommand === CommandType.SnoozeTab) {
        const parsedDateFromSearch = naturalLanguageToDate(searchQueryLowerCase);
        if (parsedDateFromSearch) {
          const dynamicTimeCommand: ICommand = {
            index: 1,
            label: `${getReadableDate(parsedDateFromSearch)} @ ${getTime(parsedDateFromSearch)}`,
            alias: getTimeAgo(parsedDateFromSearch),
            type: CommandType.SnoozeTab,
            icon: getCommandIcon(CommandType.SnoozeTab).Icon,
            metadata: parsedDateFromSearch,
          };
          setSuggestedCommands([dynamicTimeCommand]);
        } else {
          setSuggestedCommands(suggestedCommandsForSubCommand);
        }
        setFocusedCommandIndex(1);
        setIsLoadingResults(false);

        return;
      }

      //  filter suggested sub-commands
      const filteredSubCommands = suggestedCommandsForSubCommand
        .filter(c => c.label.toLowerCase().includes(searchQueryLowerCase))
        .map((cmd, idx) => ({ ...cmd, index: idx + 1 }));
      setSuggestedCommands(filteredSubCommands);

      //  only updated focused index if out of range
      setFocusedCommandIndex(prev => {
        if (prev < 1 || prev > filteredSubCommands.length) return 1;

        return prev;
      });

      setIsLoadingResults(false);
    },
    [subCommand, setSuggestedCommands, setFocusedCommandIndex, suggestedCommandsForSubCommand, getCommandIcon],
  );

  // search commands
  const handleSearchCommands = useCallback(
    async (searchTerm: string) => {
      let matchedCommands: ICommand[] = [];

      const searchQueryLowerCase = searchTerm.toLowerCase().trim();

      if (!searchQueryLowerCase) {
        setDefaultSuggestedCommands();
        setIsLoadingResults(false);
        return;
      }

      const currentGroups = await getAllGroups(activeSpace.id);
      let filteredStaticCommands = enabledCommands;

      // do not include add to group cmd if no group exists
      if (!currentGroups || currentGroups.length < 1) {
        filteredStaticCommands = filteredStaticCommands.filter(cmd => cmd.type !== CommandType.AddToGroup);
      }

      // do not add rename group cmd if tab not not in a group
      if (!groupId || groupId < 0) {
        filteredStaticCommands = filteredStaticCommands.filter(cmd => cmd.type !== CommandType.RenameGroup);
      }

      // query static matchedCommands label
      filteredStaticCommands
        .filter(
          cmd =>
            cmd.label.toLowerCase().includes(searchQueryLowerCase) ||
            cmd?.alias.toLowerCase().includes(searchQueryLowerCase),
        )
        .forEach((cmd, idx) => {
          matchedCommands.push({ ...cmd, index: idx + 1 });
        });

      // if search term is a url then add a link cmd to go to the url
      if (isValidURL(searchQueryLowerCase) || DomainWithSubdomainRegex.test(searchQueryLowerCase)) {
        matchedCommands.push({
          label: searchTerm,
          type: CommandType.Link,
          metadata: `${searchTerm}`,
          icon: getFaviconURL(parseUrl(searchTerm)),
          index: matchedCommands.length + 1,
        });
      }

      // query current tab url/title (words match)
      {
        let tabs = await getTabsInSpace(activeSpace.id);

        if (tabs?.length > 0) {
          const allTabsMatchWords = ['tabs', 'all tabs', 'all tab', 'switch', 'switch tabs', 'opened tabs'];

          if (allTabsMatchWords.includes(searchQueryLowerCase)) {
            //  show all opened tabs
            tabs.forEach(tab => {
              matchedCommands.push({
                index: matchedCommands.length + 1,
                type: CommandType.SwitchTab,
                label: tab.title,
                icon: tab.faviconUrl,
                metadata: tab.id,
                alias: 'Opened tabs',
              });
            });
          } else {
            // filter matched tabs
            tabs = tabs.filter(tab => tab.title.toLowerCase().includes(searchQueryLowerCase));

            tabs.forEach(tab => {
              matchedCommands.push({
                index: matchedCommands.length + 1,
                type: CommandType.SwitchTab,
                label: tab.title,
                icon: tab.faviconUrl,
                metadata: tab.id,
                alias: 'Opened tabs',
              });
            });
          }
        }
      }

      // query space title
      {
        let spaces = await getAllSpaces();

        spaces = spaces?.filter(s => s.id !== activeSpace.id) || [];

        const allSpacesMatchWords = [
          'space',
          'switch',
          'spaces',
          'all space',
          'all spaces',
          'switch space',
          'switch spaces',
        ];

        if (allSpacesMatchWords.includes(searchQueryLowerCase)) {
          // show all spaces
          spaces.forEach(space => {
            matchedCommands.push({
              index: matchedCommands.length + 1,
              type: CommandType.SwitchSpace,
              label: space.title,
              icon: space.emoji,
              metadata: space.id,
              alias: 'Space',
            });
          });
        } else {
          // filtered matched spaces
          spaces
            .filter(s => s.title.toLowerCase().includes(searchQueryLowerCase))
            .forEach(space => {
              matchedCommands.push({
                index: matchedCommands.length + 1,
                type: CommandType.SwitchSpace,
                label: space.title,
                icon: space.emoji,
                metadata: space.id,
                alias: 'Space',
              });
            });
        }
      }

      let alreadyMatchedCommandsTotal = 0;

      if (matchedCommands.length >= 1) {
        // returned  static matched commands
        setSuggestedCommands(matchedCommands);

        setFocusedCommandIndex(1);

        // stop search if matched commands is 6 or more
        if (matchedCommands.length >= SEARCH_RESULT_MAX_LIMIT) {
          setIsLoadingResults(false);
          return;
        }

        alreadyMatchedCommandsTotal = matchedCommands.length;

        matchedCommands = [];
      }

      // available space for cmd
      const searchResLimit = SEARCH_RESULT_MAX_LIMIT - alreadyMatchedCommandsTotal;

      // search for links, notes and more from background script
      let res = await publishEvents<ICommand[]>({
        event: 'SEARCH',
        payload: {
          searchResLimit,
          searchQuery: searchTerm,
          searchFilterPreferences: searchFilters,
        },
      });

      matchedCommands = [];

      if (res?.length > 0) {
        res = res.length > searchResLimit ? res.slice(0, searchResLimit) : res;

        matchedCommands.push(...res);
      }

      if (alreadyMatchedCommandsTotal + matchedCommands.length < 6) {
        // add web search command
        matchedCommands.push(webSearchCommand(searchTerm, 0));
      }

      setSuggestedCommands(commands => [
        ...commands,
        ...matchedCommands.map<ICommand>((cmd, idx) => ({
          ...cmd,
          index: commands.length + (idx + 1),
        })),
      ]);

      setFocusedCommandIndex(1);
      setIsLoadingResults(false);
    },
    [
      activeSpace,
      groupId,
      searchFilters,
      setSuggestedCommands,
      setFocusedCommandIndex,
      setDefaultSuggestedCommands,
      enabledCommands,
    ],
  );

  const debouncedSearchCommands = useCallback(debounce(handleSearchCommands, 300), [
    activeSpace,
    groupId,
    searchFilters,
    enabledCommands,
  ]);

  const debouncedSearchSubCommands = useCallback(debounce(handleSearchSubCommands, 300), [
    suggestedCommandsForSubCommand,
  ]);

  // reset sub command for during note capture
  useEffect(() => {
    if (subCommand === CommandType.NewNote) {
      // do nothing if subCommand is new note (note capture mode)
      // clear command suggestions
      setSuggestedCommands([]);
      setSuggestedCommandsForSubCommand([]);
      return;
    }
  }, [subCommand, setSuggestedCommands, setSuggestedCommandsForSubCommand]);

  useEffect(() => {
    if (suggestedCommandsForSubCommand.length > 0) {
      setSuggestedCommands(suggestedCommandsForSubCommand);
      setFocusedCommandIndex(1);
    }
  }, [suggestedCommandsForSubCommand, setFocusedCommandIndex, setSuggestedCommands]);

  // on command select/click
  const onCommandClick = async (index: number) => {
    setFocusedCommandIndex(index);
    await handleSelectCommand(index);
  };

  // on modal card container click
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
    <div className="overflow-hidden">
      <motion.dialog
        aria-modal
        tabIndex={-1}
        onClick={handleBackdropClick}
        ref={modalRef}
        {...bounce}
        style={{
          minWidth: COMMAND_PALETTE_SIZE.WIDTH,
          width: 'fit-content',
          maxWidth: COMMAND_PALETTE_SIZE.MAX_WIDTH + 'px',
        }}
        className={cn(`flex items-center h-fit max-h-full outline-none flex-col justify-center mt-[18px] p-0 overflow-hidden
                       mx-auto backdrop:bg-transparent  bg-transparent rounded-lg shadow-2xl shadow-brand-darkBgAccent/80`)}>
        <div className="size-full relative overflow-hidden rounded-lg ">
          {subCommand !== CommandType.NewNote ? (
            // search box
            <SearchBox
              ref={inputRef}
              subCommand={subCommand}
              searchQuery={searchQuery}
              searchFilters={searchFilters}
              setSearchFilters={setSearchFilters}
              isNotesDisabled={isNotesDisabled}
              placeholder={searchQueryPlaceholder}
              handleFocusSearchInput={handleFocusSearchInput}
              onClearSearch={() => {
                setSubCommand(null);
                setDefaultSuggestedCommands();
                setSuggestedCommandsForSubCommand([]);
                setFocusedCommandIndex(1);
              }}
              setSearchQuery={async value => {
                setSearchQuery(value);

                // do not nothing if suggested commands for sub command is 1
                // (search input is used as an input for group name,space title, etc.)
                if (subCommand && suggestedCommandsForSubCommand.length < 1 && suggestedCommands.length === 1) return;

                setIsLoadingResults(true);
                setSuggestedCommands([]);

                if (!value.trim() && !subCommand) {
                  // reset suggested commands
                  await setDefaultSuggestedCommands();
                  setSearchQueryPlaceholder(DEFAULT_SEARCH_PLACEHOLDER);
                  setIsLoadingResults(false);
                }

                if (value.trim() && !subCommand) {
                  console.log('🚨 ~ value.trim:', value.trim());

                  debouncedSearchCommands(value);
                }

                if (subCommand && suggestedCommandsForSubCommand.length > 0) {
                  if (value.trim()) {
                    // search sub commands
                    debouncedSearchSubCommands(value);
                    return;
                  }

                  // reset suggested commands for sub commands

                  setSuggestedCommands(suggestedCommandsForSubCommand);

                  //  only updated focused index if out of range
                  setFocusedCommandIndex(prev => {
                    if (prev < 1 || prev > suggestedCommandsForSubCommand.length) return 1;
                    setIsLoadingResults(false);

                    return prev;
                  });
                }
              }}
            />
          ) : (
            // create note
            <CaptureNote
              selectedNote={
                selectedNoteId || (suggestedCommands?.length > 0 ? (suggestedCommands[0].metadata as string) : '')
              }
              isOpenedInPopupWindow={isOpenedInPopupWindow}
              resetSuggestedCommand={() => setSuggestedCommands([])}
              userSelectedText={userSelectedText}
              activeSpace={activeSpace}
              onClose={() => handleCloseCommandPalette()}
              handleGoBack={() => {
                setSubCommand(null);
                setDefaultSuggestedCommands();
              }}
            />
          )}
          {/* search suggestions and result */}
          {subCommand !== CommandType.NewNote ? (
            <div
              ref={suggestionContainerRef}
              style={{
                maxHeight: SUGGESTED_COMMANDS_MAX_HEIGHT + 'px',
              }}
              className={`bg-brand-darkBg w-ft max-w-[600px] h-fit max-h-full overflow-hidden overflow-y-auto cc-scrollbar cc-scrollbar mx-auto shadow-md
                shadow-slate-800/80 `}>
              {/* actions */}
              {suggestedCommands?.length > 0 &&
                suggestedCommands?.map(cmd => {
                  const renderCommands: JSX.Element[] = [];
                  // section label
                  // do not render  for sub commands
                  !subCommand &&
                    renderCommands.push(
                      <CommandDivider
                        key={cmd.index}
                        index={cmd.index}
                        isStaticCommand={isStaticCommand(cmd.label)}
                        suggestedCommands={suggestedCommands}
                      />,
                    );
                  //  command
                  renderCommands.push(
                    <Command
                      key={cmd.index}
                      index={cmd.index}
                      label={cmd.label}
                      type={cmd.type}
                      Icon={cmd.icon}
                      searchTerm={
                        subCommand && suggestedCommandsForSubCommand.length < 1 ? '' : searchQuery.toLowerCase().trim()
                      }
                      alias={cmd?.alias || ''}
                      metadata={(cmd?.metadata as string) || ''}
                      isSubCommand={!!subCommand}
                      isStaticCommand={isStaticCommand(cmd.label)}
                      isFocused={focusedCommandIndex === cmd.index}
                      onClick={() => onCommandClick(cmd.index)}
                    />,
                  );

                  // render commands & labels
                  return <>{renderCommands.map(cmd1 => cmd1)}</>;
                })}

              {/* lading commands ui (skeleton) */}
              {isLoadingResults || enabledCommands.length < 1
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
              {!isLoadingResults && suggestedCommands?.length < 1 && enabledCommands.length > 0 ? (
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
              className={`bg-brand-darkBg/95 shadow-sm shadow-slate-800/70  w-full flex items-center justify-between px-2 pt-1 pb-2 select-none
                      rounded-bl-md rounded-br-md border-t border-brand-darkBgAccent/60`}
              // focuses on the search input box if clicked
              onClick={handleFocusSearchInput}>
              <div className="text-slate-500/90 text-[10.5px] ml-1">FreshTabs</div>
              <div className="flex items-center gap-x-[7px]">
                <KBD upArrowKey classes="text-slate-500 bg-brand-darkBgAccent/35 text-[8px] font-extralight" />
                <KBD downArrowKey classes="text-slate-500 bg-brand-darkBgAccent/35 text-[8px] font-extralight" />
                <KBD modifierKey classes="text-slate-500 bg-brand-darkBgAccent/35 text-[13px]" />
                <KBD enterKey classes="text-slate-500 bg-brand-darkBgAccent/35 text-[13px]" />
              </div>
            </div>
          ) : null}
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
