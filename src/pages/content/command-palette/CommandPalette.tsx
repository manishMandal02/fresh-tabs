import { motion } from 'framer-motion';
import { useState, useEffect, useRef, MouseEventHandler, useCallback } from 'react';

import Command from './command/Command';
import { cn } from '@root/src/utils/cn';
import CaptureNote from '../capture-note';
import SearchBox from './search-box/SearchBox';
import KBD from '@root/src/components/kbd/KBD';
import { getFaviconURL } from '../../../utils/url';
import { CommandType } from '@root/src/constants/app';
import CommandDivider from './command/CommandDivider';
import { useCommandPalette } from './useCommandPalette';
import { getTime } from '@root/src/utils/date-time/get-time';
import { publishEvents } from '../../../utils/publish-events';
import { getTimeAgo } from '@root/src/utils/date-time/time-ago';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getReadableDate } from '@root/src/utils/date-time/getReadableDate';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';
import { staticCommands, useCommand, webSearchCommand } from './command/useCommand';
import { ICommand, ISearchFilters, ISpace, ITab } from '../../../types/global.types';
import { naturalLanguageToDate } from '../../../utils/date-time/naturalLanguageToDate';
import { getAllGroups } from '@root/src/services/chrome-storage/groups';

export const COMMAND_PALETTE_SIZE = {
  HEIGHT: 500,
  WIDTH: 600,
  MAX_HEIGHT: 500 + 100,
  MAX_WIDTH: 600 + 200,
} as const;

export const COMMAND_HEIGHT = 38;

const SUGGESTED_COMMANDS_MAX_HEIGHT = 400;

type Props = {
  activeSpace: ISpace;
  recentSites: ITab[];
  onClose?: () => void;
  searchFiltersPreference: ISearchFilters;
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
  recentSites,
  onClose,
  searchFiltersPreference,
  userSelectedText,
  selectedNoteId,
  isOpenedInPopupWindow,
}: Props) => {
  console.log('CommandPalette ~ 🔁 rendered');

  // loading search result
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  const [searchFilters, setSearchFilters] = useState<ISearchFilters>({ searchBookmarks: false, searchNotes: false });

  // elements ref
  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionContainerRef = useRef<HTMLDivElement>(null);

  const handleClose = useCallback(() => {
    modalRef.current?.close();
    onClose();
  }, [onClose]);

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
    isOpenedInPopupWindow,
    onClose: handleClose,
  });

  const { isStaticCommand, getCommandIcon } = useCommand();

  // focus search input box
  const handleFocusSearchInput = () => {
    inputRef.current?.focus();
  };

  // initialize component
  useEffect(() => {
    modalRef.current?.showModal();
    handleFocusSearchInput();

    if (searchFiltersPreference) {
      setSearchFilters(searchFiltersPreference);
    }

    if (!userSelectedText && !selectedNoteId) {
      setDefaultSuggestedCommands();
    } else {
      setSubCommand(CommandType.NewNote);
    }
    // run when component mounts
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // check if the focused command is visible
  useEffect(() => {
    const numOfVisibleCommands = (SUGGESTED_COMMANDS_MAX_HEIGHT - 15) / COMMAND_HEIGHT;

    if (focusedCommandIndex < numOfVisibleCommands && suggestionContainerRef.current?.scrollTop < 1) return;

    const focusedEl = suggestionContainerRef.current?.querySelector(`#fresh-tabs-command-${focusedCommandIndex}`);

    focusedEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [focusedCommandIndex, suggestedCommands]);

  // set default suggested commands
  const setDefaultSuggestedCommands = useCallback(async () => {
    let filteredStaticCommands = staticCommands;
    const currentGroups = await getAllGroups(activeSpace.id);

    if (currentGroups && currentGroups.length < 1) {
      filteredStaticCommands = filteredStaticCommands.filter(cmd => cmd.type !== CommandType.AddToGroup);
    }

    const recentSitesCommands = recentSites.map<ICommand>((site, idx) => ({
      index: 1 + idx + filteredStaticCommands.length,
      type: CommandType.Link,
      label: site.title,
      icon: getFaviconURL(site.url),
      metadata: site.url,
      alias: 'History',
    }));

    setSuggestedCommands([...filteredStaticCommands, ...(recentSitesCommands || [])]);
    setFocusedCommandIndex(1);
  }, [recentSites, setSuggestedCommands, setFocusedCommandIndex, activeSpace]);

  // search commands
  const handleGlobalSearch = useCallback(
    async (searchQuery: string) => {
      let matchedCommands: ICommand[] = [];

      const searchQueryLowerCase = searchQuery.toLowerCase().trim();

      const currentGroups = await getAllGroups(activeSpace.id);
      let filteredStaticCommands = staticCommands;
      if (currentGroups && currentGroups.length < 1) {
        filteredStaticCommands = staticCommands.filter(cmd => cmd.type !== CommandType.AddToGroup);
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
                icon: getFaviconURL(tab.url),
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
                icon: getFaviconURL(tab.url),
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
          'spaces',
          'all space',
          'all spaces',
          'switch',
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

      if (matchedCommands.length > 5) {
        // returned  static matched commands
        return matchedCommands;
      }

      console.log('🚀 ~ handleGlobalSearch ~ searchQuery:', searchQuery);

      // search for links, notes and more from background script
      const res = await publishEvents<ICommand[]>({
        event: 'SEARCH',
        payload: { searchQuery, searchFilterPreferences: searchFilters },
      });

      if (res?.length > 0) {
        // remove duplicates
        matchedCommands = [...(matchedCommands.length ? [...matchedCommands] : []), ...res].filter(
          (v, i, a) => a.findIndex(v2 => v2.metadata === v.metadata) === i,
        );
        matchedCommands = matchedCommands.map<ICommand>((cmd, idx) => ({
          ...cmd,
          index: idx + 1,
        }));
      }

      if (matchedCommands.length < 6) {
        matchedCommands.push(webSearchCommand(searchQuery, matchedCommands.length + 1));
      }

      console.log('🔵 ~ handleGlobalSearch():294 ~ matchedCommands:', matchedCommands);
      return matchedCommands;
    },

    [activeSpace, searchFilters],
  );

  let timeoutId: NodeJS.Timeout;

  const debounceGlobalSearch = (searchTerm: string) => {
    clearTimeout(timeoutId);

    timeoutId = setTimeout(() => {
      console.log('⏳ ~ ~ setTimeout called:', setTimeout);
      (async () => {
        // Perform the search request here
        const commands = await handleGlobalSearch(searchTerm);

        console.log('✅ ~ setTimeout: 306 ~ commands:', commands);

        setSuggestedCommands(commands);
        setIsLoadingResults(false);

        setFocusedCommandIndex(1);
      })();
    }, 300);
  };

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
      setSuggestedCommands([]);
      debounceGlobalSearch(searchQuery);
    } else if (!searchQuery.trim() && !subCommand) {
      // reset search
      setDefaultSuggestedCommands();
      setSearchQueryPlaceholder('Switch...');
      setFocusedCommandIndex(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, subCommand, searchFilters]);

  // on search during sub command
  useEffect(() => {
    // filter the suggested sub commands based on search query, also update the index
    if (subCommand && searchQuery.trim() && suggestedCommandsForSubCommand.length > 0) {
      // handle snooze sub command, generate date & time based on user input
      if (subCommand === CommandType.SnoozeTab) {
        const parsedDateFromSearch = naturalLanguageToDate(searchQuery);
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
      } else {
        //  filter suggested sub-commands based on user input
        const filteredSubCommands = suggestedCommandsForSubCommand
          .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((cmd, idx) => ({ ...cmd, index: idx + 1 }));
        setSuggestedCommands(filteredSubCommands);

        //  only updated focused index if out of range
        setFocusedCommandIndex(prev => {
          if (prev < 1 || prev > filteredSubCommands.length) return 1;

          return prev;
        });
      }
    } else if (subCommand && !searchQuery && suggestedCommandsForSubCommand.length > 0) {
      setSuggestedCommands(suggestedCommandsForSubCommand);

      //  only updated focused index if out of range

      setFocusedCommandIndex(prev => {
        if (prev < 1 || prev > suggestedCommandsForSubCommand.length) return 1;

        return prev;
      });
    }
    // re-render only when the below dependency change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, subCommand, suggestedCommandsForSubCommand]);

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
              setSearchQuery={setSearchQuery}
              setSearchFilters={setSearchFilters}
              placeholder={searchQueryPlaceholder}
              handleFocusSearchInput={handleFocusSearchInput}
              onClearSearch={() => {
                setSubCommand(null);
                setDefaultSuggestedCommands();
                setSuggestedCommandsForSubCommand([]);
                setFocusedCommandIndex(1);
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
                      searchTerm={searchQuery.toLowerCase().trim()}
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
              {!isLoadingResults && suggestedCommands?.length < 1 ? (
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
              <div className="text-slate-500 text-[10.5px] ml-1">FreshTabs</div>
              <div className="flex items-center gap-x-[7px]">
                <KBD upArrowKey />
                <KBD downArrowKey />
                <KBD modifierKey />
                <KBD enterKey />
              </div>
            </div>
          ) : null}
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
