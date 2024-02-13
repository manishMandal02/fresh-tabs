import { MdSearch, MdKeyboardTab } from 'react-icons/md';
import { FaLocationArrow, FaFolder } from 'react-icons/fa';
import { TbArrowMoveRight } from 'react-icons/tb';

import { motion } from 'framer-motion';
import { useEffect, useRef, MouseEventHandler, ReactEventHandler, useCallback } from 'react';
import type { IconType } from 'react-icons/lib';

import { getFaviconURL } from '../../utils';
import { isValidURL } from '../../utils/isValidURL';
import Tooltip from '../../sidepanel/components/elements/tooltip';
import { CommandType, ICommand, ISpace, ITab } from '../../types/global.types';
import { useCommandPalette } from './useCommandPalette';
import { debounce } from '../../utils/debounce';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { publishEvents } from '../../utils/publish-events';

const staticCommands: ICommand[] = [
  { index: 1, type: CommandType.SwitchTab, label: 'Go to Tab', icon: MdKeyboardTab },
  { index: 2, type: CommandType.SwitchSpace, label: 'Switch Space', icon: FaLocationArrow },
  { index: 3, type: CommandType.NewSpace, label: 'New Space', icon: FaFolder },
  { index: 4, type: CommandType.AddToSpace, label: 'Move Tab', icon: TbArrowMoveRight },
];

const COMMAND_HEIGHT = 30;

const SUGGESTED_COMMANDS_MAX_HEIGHT = 420;

const commandDivider: ICommand = {
  index: -1,
  label: 'divider',
  type: CommandType.Divider,
};

type Props = {
  activeSpace: ISpace;
  recentSites: ITab[];
  topSites: ITab[];
};

const CommandPalette = ({ activeSpace, recentSites, topSites }: Props) => {
  // snackbar sate

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
  } = useCommandPalette({ activeSpace, modalRef });

  // check if the focused command is visible
  useEffect(() => {
    const numOfVisibleCommands = SUGGESTED_COMMANDS_MAX_HEIGHT / COMMAND_HEIGHT;

    if (focusedCommandIndex < numOfVisibleCommands && suggestionContainerRef.current?.scrollTop < 1) return;

    const focusedEl = suggestionContainerRef.current?.querySelector(`#fresh-tabs-command-${focusedCommandIndex}`);

    focusedEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
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

    setSuggestedCommands([...staticCommands, commandDivider, ...recentSitesCommands]);
  }, [recentSites, setSuggestedCommands]);

  // initialize component
  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ useEffect: 🎉🎉');
    modalRef.current?.showModal();
    inputRef.current?.focus();

    setDefaultSuggestedCommands();
  }, [setDefaultSuggestedCommands]);

  const handleSearchIconClick = () => {
    inputRef.current?.focus();
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
      .forEach((space, idx) => {
        if (idx === 0) {
          matchedCommands.push(commandDivider);
        }
        matchedCommands.push({
          index: matchedCommands.filter(c => c.type !== CommandType.Divider).length + 1,
          type: CommandType.SwitchSpace,
          label: space.title,
          icon: space.emoji,
          metadata: space.id,
        });
      });

    // Todo -  send search event to handle tab query & history search & bookmark search
    const res = await publishEvents<ICommand[]>({ event: 'SEARCH', payload: { searchQuery, spaceId: activeSpace.id } });

    if (res?.length > 0) {
      res.forEach(cmd => {
        if (cmd.index === 0) {
          matchedCommands.push(commandDivider);
        }
        matchedCommands.push({
          ...cmd,
          index: matchedCommands.filter(c => c.type !== CommandType.Divider).length + 1,
        });
      });
    }

    // also look at google search keywords

    // query bookmark (words match)
    console.log('🚀 ~ handleGlobalSearch ~ matchedCommands:', matchedCommands);

    setSuggestedCommands(matchedCommands);
    setFocusedCommandIndex(1);
  }, [setSuggestedCommands, setFocusedCommandIndex, activeSpace, searchQuery]);

  // on global search
  useEffect(() => {
    console.log('🚀 ~ useEffect global search ~ searchQuery:', searchQuery);
    if (searchQuery.trim() && !subCommand) {
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
    console.log('🚀 ~ useEffect sub command search ~ searchQuery:', searchQuery);
    if (subCommand && searchQuery && suggestedCommandsForSubCommand.length > 0) {
      // filter the suggested sub commands based on search query, also update the index
      const filteredSubCommands = suggestedCommandsForSubCommand
        .filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()))
        .map((cmd, idx) => ({ ...cmd, index: idx + 1 }));
      setSuggestedCommands(filteredSubCommands);
      setFocusedCommandIndex(1);
    } else if (subCommand && !searchQuery && suggestedCommandsForSubCommand.length > 0) {
      setSuggestedCommands(suggestedCommandsForSubCommand);
      setFocusedCommandIndex(1);
    }
  }, [searchQuery, subCommand, suggestedCommandsForSubCommand, setFocusedCommandIndex, setSuggestedCommands]);

  const onCommandClick = async (index: number) => {
    setFocusedCommandIndex(index);
    await handleSelectCommand();
  };

  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.src = 'https://freshinbox.xyz/favicon.ico';
  };

  // bounce animation
  const bounceDivAnimation = {
    initial: { scale: 0, opacity: 0 },
    whileInView: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40 },
  };

  // show sub command indicator instead of search icon in search box
  const SubCommandIndicator = (type?: CommandType) => {
    let Icon = staticCommands[1].icon;
    let label = 'Switch Space';

    const cmdType = type || subCommand;

    console.log('🚀 ~ SubCommandIndicator ~ cmdType:', cmdType);

    if (cmdType === CommandType.NewSpace) {
      Icon = staticCommands[2].icon;
      label = 'New Space';
    } else if (cmdType === CommandType.AddToSpace) {
      Icon = staticCommands[3].icon;
      label = 'Move Tab';
    } else if (cmdType === CommandType.SwitchTab) {
      Icon = staticCommands[0].icon;
      label = 'Switch Tab';
    }

    return (
      <div className="flex items-center justify-start h-full border-r border-brand-darkBgAccent px-[7px] mr-2">
        <Icon className=" fill-slate-600 text-slate-600 mr-1.5" size={16} />
        <p className="text-slate-400 text-[12px] font-light m-0 p-0 whitespace-nowrap">{label}</p>
      </div>
    );
  };

  // command section label
  const CommandSectionLabel = (index: number, cmdLabel: string) => {
    if (index < 1 || staticCommands.filter(c => c.label === cmdLabel).length > 0) return;

    let sectionLabel = '';

    if (searchQuery.trim() && index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchTab)?.index) {
      sectionLabel = 'Opened tabs';
    } else if (index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.RecentSite)?.index) {
      sectionLabel = 'Recently Visited';
    } else if (
      searchQuery.trim() &&
      index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchSpace)?.index
    ) {
      sectionLabel = 'Spaces';
    }

    if (!sectionLabel) return;

    return (
      <p key={index} className="text-[12px] text-slate-500 font-light mt-1 ml-2.5" tabIndex={-1}>
        {sectionLabel}
      </p>
    );
  };

  // command component
  const Command = (index: number, label: string, type: CommandType, Icon?: IconType | string) => {
    const isFocused = focusedCommandIndex === index;

    return (
      <button
        id={`fresh-tabs-command-${index}`}
        className={`w-full flex items-center justify-start px-3 py-[6px] outline-none 
        transition-all duration-200 ease-in ${isFocused ? 'bg-brand-darkBgAccent/70' : ''} `}
        onClick={() => onCommandClick(index)}
        style={{ height: COMMAND_HEIGHT + 'px' }}>
        {/* special commands */}
        {/* {!!searchQuery && type === CommandType.SwitchTab ? SubCommandIndicator(CommandType.SwitchTab) : null} */}
        <div className="w-[22px]">
          {typeof Icon === 'string' ? (
            !isValidURL(Icon) ? (
              <span className="w-[18px] h-fit">{Icon}</span>
            ) : (
              <img
                alt="icon"
                src={Icon}
                onError={handleImageLoadError}
                className="w-[14px] h-fit object-left rounded-md opacity-95 object-scale-down"
              />
            )
          ) : (
            <Icon className="fill-slate-600 text-slate-500" size={14} />
          )}
        </div>
        <p className="text-[12px] text-start text-slate-400 font-light min-w-[50%] max-w-[85%] whitespace-nowrap  overflow-hidden text-ellipsis">
          {label}
        </p>
      </button>
    );
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div className="w-screen h-screen flex items-center justify-center fixed top-0 left-0 overflow-hidden ">
      <motion.dialog
        aria-modal
        tabIndex={-1}
        ref={modalRef}
        onKeyDown={ev => {
          ev.stopPropagation();
        }}
        {...bounceDivAnimation}
        onClick={handleBackdropClick}
        className=" m-0 flex items-center outline-none flex-col justify-center top-[20%] h-fit max-h-[75vh] w-[520px] left-[33.5%] backdrop:to-brand-darkBg/30 p-px bg-transparent">
        {/* most visited sites */}
        <div className="mb-[8px]  overflow-hidden w-[98%] mx-auto ">
          <p className="text-slate-500 text-[11px] font-thin m-0 bg-brand-darkBg px-3 py-px mx-auto rounded-tr-lg -mb-1 rounded-tl-lg w-fit text-center">
            Most visited
          </p>
          <div className="flex w-full items-center py-2 rounded-lg justify-around bg-brand-darkBg px-2">
            {topSites?.map(site => (
              <Tooltip key={site.url} label={site.title} delay={500}>
                <button
                  className={`bg-brand-darkBgAccent rounded-md flex items-center justify-center outline-none p-1 px-1.5 
                        border border-brand-darkBgAccent focus:border-slate-500/80 focus:bg-slate-700 transition-all duration-200 ease-in-out1`}>
                  <img
                    alt="icon"
                    src={getFaviconURL(site.url, false)}
                    onError={handleImageLoadError}
                    className="w-[16px] h-[16px] object-scale-down object-center"
                  />
                </button>
              </Tooltip>
            ))}
          </div>
        </div>
        {/* search box */}
        <div
          className={`w-full h-[50px] min-h-[50px]: bg-brand-darkBg rounded-xl flex items-center justify-start border-collapse overflow-hidden
                    shadow-lg shadow-slate-800 border border-slate-600/70`}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            className="flex items-center justify-center w-fit h-full bg-slate-60 rounded-tl-xl rounded-bl-xl"
            tabIndex={-1}
            onClick={handleSearchIconClick}
            role="img">
            {!subCommand ? (
              <MdSearch className="fill-slate-700 bg-transparent ml-1.5 mr-1" size={24} />
            ) : (
              SubCommandIndicator()
            )}
          </div>
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            ref={inputRef}
            placeholder={searchQueryPlaceholder}
            onChange={ev => setSearchQuery(ev.currentTarget.value)}
            type="text"
            spellCheck={false}
            onKeyDown={ev => {
              if (ev.key === 'Backspace' && searchQuery === '') {
                setSubCommand(null);
                setDefaultSuggestedCommands();
                setSuggestedCommandsForSubCommand([]);
                setFocusedCommandIndex(1);
                return;
              }
              if (ev.key.includes('ArrowDown') || ev.key.includes('ArrowUp')) {
                ev.preventDefault();
              }
            }}
            value={searchQuery}
            className={`text-[14px] text-slate-300 w-auto flex-grow px-px  py-2.5  placeholder:text-slate-600 placeholder:font-light
                       bg-transparent rounded-tr-xl caret-slate-300 caret rounded-br-xl outline-none border-none`}
          />
        </div>
        {/* search suggestions and result */}
        <div
          ref={suggestionContainerRef}
          style={{
            maxHeight: SUGGESTED_COMMANDS_MAX_HEIGHT + 'px',
          }}
          className="bg-brand-darkBg w-full h-fit overflow-hidden overflow-y-auto cc-scrollbar mx-auto   shadow-sm shadow-slate-800/70 border mt-2 border-y-0 border-slate-600/60 border-collapse rounded-md">
          {/* actions */}
          {suggestedCommands.length > 0 &&
            suggestedCommands?.map(cmd => {
              const renderCommands: JSX.Element[] = [];
              renderCommands.push(CommandSectionLabel(cmd.index, cmd.label));

              if (cmd.type !== CommandType.Divider) {
                renderCommands.push(Command(cmd.index, cmd.label, cmd.type, cmd.icon));
              } else {
                renderCommands.push(
                  <hr
                    key={cmd.index}
                    className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0"
                    tabIndex={-1}
                  />,
                );
              }

              return <>{renderCommands.map(cmd1 => cmd1)}</>;
            })}
          {/* no commands found */}
          {suggestedCommands.length === 0 ? (
            <div
              className="w-full flex items-center justify-center text-slate-500 text-sm font-light py-1"
              style={{ height: COMMAND_HEIGHT + 'px' }}>
              No result for {searchQuery || ''}
            </div>
          ) : null}
        </div>
        {/* navigation guide */}
        <div
          className={`bg-brand-darkBg shadow-sm shadow-slate-800/70 rounded-bl-md rounded-br-md w-[99%] flex items-center justify-center px-4 py-1.5 
                        border-t border-brand-darkBgAccent/80 text-slate-500/90 font-light text-[11px] `}>
          <span className="mr-2">
            <kbd>Up</kbd>
          </span>
          <span className="mr-2">
            <kbd>Down</kbd>
          </span>
          <span className="mr-2">
            <kbd>Tab</kbd>
          </span>
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
