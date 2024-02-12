import { MdAdd, MdNewLabel, MdSearch, MdSwitchLeft } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useEffect, useRef, MouseEventHandler, ReactEventHandler, useState, useCallback } from 'react';
import type { IconType } from 'react-icons/lib';

import { getFaviconURL } from '../../utils';
import { isValidURL } from '../../utils/isValidURL';
import Tooltip from '../../sidepanel/components/elements/tooltip';
import { CommandType, ISpace, ITab } from '../../types/global.types';
import { useCommandPalette } from './useCommandPalette';
import { debounce } from '../../utils/debounce';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { publishEvents } from '../../utils/publish-events';

export type Command = {
  index: number;
  type: CommandType;
  label: string;
  icon?: string | IconType;
  metadata?: string | number;
};

const staticCommands: Command[] = [
  { index: 1, type: CommandType.SwitchSpace, label: 'Switch Space', icon: MdSwitchLeft },
  { index: 2, type: CommandType.NewSpace, label: 'New Space', icon: MdNewLabel },
  { index: 3, type: CommandType.AddToSpace, label: 'Add To Space', icon: MdNewLabel },
];

const commandDivider: Command = {
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
  // search query
  const [searchQuery, setSearchQuery] = useState('');

  // snackbar sate
  // const [snackbar, setSnackbar] = useState({ isSuccess: false, msg: '' });

  // elements ref
  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
  } = useCommandPalette({ activeSpace, modalRef, searchQuery });

  // set default suggested commands
  const setDefaultSuggestedCommands = useCallback(() => {
    const recentSitesCommands = recentSites.map<Command>((site, idx) => ({
      index: 1 + idx + staticCommands.length,
      type: CommandType.RecentSite,
      label: site.title,
      icon: site.url,
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
    const commands: Command[] = [];

    // query static commands label
    staticCommands
      .filter(cmd => cmd.label.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach((cmd, idx) => {
        commands.push({ ...cmd, index: idx + 1 });
      });

    // query space title
    const spaces = await getAllSpaces();

    spaces
      .filter(s => s.id !== activeSpace.id && s.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .forEach((space, idx) => {
        if (idx === 0) {
          commands.push(commandDivider);
        }
        commands.push({
          index: 1 + idx + commands.length,
          type: CommandType.SwitchSpace,
          label: space.title,
          icon: space.emoji,
          metadata: space.id,
        });
      });

    // Todo -  send search event to handle tab query & history search & bookmark search
    const res = await publishEvents<Command[]>({ event: 'SEARCH', payload: { searchQuery } });
    if (res.length > 0) {
      commands.push(...res);
    }
    // also look at google search keywords

    // query current tab url/title (words match)
    // const tabs = await chrome.tabs.query({ currentWindow: true, title: searchQuery });

    // tabs.forEach((tab, idx) => {
    //   commands.push({
    //     index: 1 + idx + commands.length,
    //     type: CommandType.SwitchTab,
    //     label: tab.title,
    //     icon: tab.favIconUrl,
    //     metadata: tab.id,
    //   });
    // });

    // google search with input query

    // query history (words match)
    // const history = await chrome.history.search({ text: searchQuery, maxResults: 4 });

    // history.forEach((item, idx) => {
    //   commands.push({
    //     index: 1 + idx + commands.length,
    //     type: CommandType.RecentSite,
    //     label: item.title,
    //     icon: item.url,
    //   });
    // });

    // query bookmark (words match)
    console.log('🚀 ~ handleGlobalSearch ~ commands:', commands);

    setSuggestedCommands(commands);
    setFocusedCommandIndex(1);
  }, [setSuggestedCommands, setFocusedCommandIndex, activeSpace, searchQuery]);

  // on global search
  useEffect(() => {
    if (searchQuery) {
      // debounce search
      debounce(handleGlobalSearch)();
    } else {
      // reset search
      setDefaultSuggestedCommands();
      setFocusedCommandIndex(1);
    }
  }, [searchQuery, handleGlobalSearch, setFocusedCommandIndex, setSuggestedCommands, setDefaultSuggestedCommands]);

  // on search for sub command
  useEffect(() => {
    console.log('🚀 ~ useEffect ~ searchQuery:', searchQuery);
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
  const SubCommandIndicator = () => {
    let Icon = MdSwitchLeft;
    let label = 'Switch Space';

    if (subCommand === CommandType.NewSpace) {
      Icon = MdNewLabel;
      label = 'New Space';
    } else if (subCommand === CommandType.AddToSpace) {
      Icon = MdAdd;
      label = 'Add To Space';
    }

    return (
      <div className="flex items-center justify-start h-full border-r border-brand-darkBgAccent px-[7px] mr-2">
        <Icon className=" fill-slate-500/90 mr-1" size={18} />
        <p className="text-slate-400 text-[12px] font-light m-0 p-0 whitespace-nowrap">{label}</p>
      </div>
    );
  };

  const Command = (index: number, label: string, Icon?: IconType | string) => {
    const isFocused = focusedCommandIndex === index;
    return (
      <button
        id={`fresh-tabs-command-${index}`}
        className={`w-full flex items-center justify-start px-3 py-[6px] outline-none 
        transition-all duration-200 ease-in ${isFocused ? 'bg-brand-darkBgAccent/70' : ''} `}
        onClick={() => onCommandClick(index)}>
        <div className="w-[5%]">
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
            <Icon className="fill-slate-500" size={18} />
          )}
        </div>
        <p className="text-[13px] text-start text-slate-400 font-light min-w-[50%] max-w-[85%] whitespace-nowrap  overflow-hidden text-ellipsis">
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
        className="absolute m-0 flex outline-none flex-col justify-center top-[20%] h-fit w-[520px] left-[33.5%] backdrop:to-brand-darkBg/30 p-px bg-transparent">
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
        <div
          className={`w-full h-[50px] bg-brand-darkBg rounded-xl flex items-center justify-start border-collapse overflow-hidden
                    shadow-lg shadow-slate-800 border border-slate-600/70`}>
          {/* search box */}
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
            className={`text-[14px] text-slate-300 w-auto flex-grow px-px  py-2.5 bg-transparent placeholder:text-slate-500
                    rounded-tr-xl caret-slate-300 caret rounded-br-xl outline-none border-none`}
          />
        </div>
        {/* search suggestions and result */}
        <div className="bg-brand-darkBg shadow-sm w-full mx-auto overflow-hidden shadow-slate-800/80 border mt-1 border-t-0 border-slate-600/60 border-collapse rounded-xl">
          {/* actions */}
          <div>
            {suggestedCommands.map(cmd => {
              const renderCommands: JSX.Element[] = [];
              if (
                cmd.index !== -1 &&
                cmd.index === suggestedCommands.findIndex(cmd1 => cmd1.type === CommandType.RecentSite)
              ) {
                renderCommands.push(
                  <p key={cmd.index} className="text-[10px] text-slate-500 font-light mt-1 ml-2  -mb-px" tabIndex={-1}>
                    Recently Visited
                  </p>,
                );
              }

              if (cmd.type !== CommandType.Divider) {
                renderCommands.push(Command(cmd.index, cmd.label, cmd.icon));
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
          </div>
          {/* navigation guide */}
          <div
            className={`bg-brand-darkBgAccent/20 rounded-bl-lg rounded-br-lg flex items-center justify-center px-4 py-2 
                        border-t border-brand-darkBgAccent text-slate-500 font-light text-[12px] `}>
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
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
