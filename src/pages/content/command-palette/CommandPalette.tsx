import { useState, useEffect, useRef, MouseEventHandler, ReactEventHandler, useCallback } from 'react';
import { MdSearch, MdOutlineKeyboardReturn, MdMoveDown, MdOutlineSnooze } from 'react-icons/md';
import { FaFolder, FaSearch, FaLongArrowAltUp } from 'react-icons/fa';
import { BsFillMoonStarsFill } from 'react-icons/bs';
import { FaArrowRightFromBracket, FaArrowRight, FaLink } from 'react-icons/fa6';
import { motion } from 'framer-motion';

import { debounce } from '../../utils/debounce';
import { getFaviconURL } from '../../utils/url';
import { CommandType } from '@root/src/constants/app';
import { useCommandPalette } from './useCommandPalette';
import { isValidURL } from '../../utils/url/validate-url';
import { publishEvents } from '../../utils/publish-events';
import { limitCharLength } from '../../utils/limitCharLength';
import Tooltip from '../../sidepanel/components/elements/tooltip';
import { prettifyDate } from '../../utils/date-time/prettifyDate';
import { ICommand, ISpace, ITab } from '../../types/global.types';
import { useCustomAnimation } from '../../sidepanel/hooks/useAnimation';
import { getTabsInSpace } from '@root/src/services/chrome-storage/tabs';
import { getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { naturalLanguageToDate } from '../../utils/date-time/naturalLanguageToDate';

// default static commands
const staticCommands: ICommand[] = [
  { index: 1, type: CommandType.SwitchTab, label: 'Switch Tab', icon: FaArrowRight },
  { index: 2, type: CommandType.SwitchSpace, label: 'Switch Space', icon: FaArrowRightFromBracket },
  { index: 3, type: CommandType.NewSpace, label: 'New Space', icon: FaFolder },
  { index: 4, type: CommandType.AddToSpace, label: 'Move Tab', icon: MdMoveDown },
  { index: 5, type: CommandType.SnoozeTab, label: 'Snooze Tab', icon: MdOutlineSnooze },
  { index: 6, type: CommandType.DiscardTabs, label: 'Discard Tabs', icon: BsFillMoonStarsFill },
];

const isStaticCommands = (label: string) => {
  return staticCommands.some(cmd => cmd.label === label);
};

export const getCommandIcon = (type: CommandType) => {
  // if (type === CommandType.RecentSite) {
  //   return { label: 'Open', Icon: MdLink };
  // }

  const cmd = staticCommands.find(cmd => cmd.type === type);

  return { Icon: cmd.icon, label: cmd.label };
};

const webSearchCommand = (query: string, index: number) => {
  return {
    index,
    label: `Web Search: <b className="text-slate-300">${query}</b>`,
    type: CommandType.WebSearch,
    icon: FaSearch,
  };
};

const COMMAND_HEIGHT = 30;

const SUGGESTED_COMMANDS_MAX_HEIGHT = 400;

type Props = {
  activeSpace: ISpace;
  recentSites: ITab[];
  topSites: ITab[];
  onClose?: () => void;
};

const CommandPalette = ({ activeSpace, recentSites, topSites, onClose }: Props) => {
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

  // check if the focused command is visible
  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ suggestedCommands:', suggestedCommands);
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
      console.log('🚀 ~ handleGlobalSearch ~ resMatchedCommands:', resMatchedCommands);
      setSuggestedCommands(prev => [...prev, ...resMatchedCommands]);
    }

    setIsLoadingResults(false);

    setFocusedCommandIndex(1);
  }, [setSuggestedCommands, setFocusedCommandIndex, activeSpace, searchQuery]);

  // on global search
  useEffect(() => {
    console.log('🚀 ~ useEffect global search ~ searchQuery:', searchQuery);
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
    console.log('🚀 ~ useEffect sub command search ~ searchQuery:', searchQuery);
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

  const onCommandClick = async (index: number) => {
    setFocusedCommandIndex(index);
    await handleSelectCommand();
  };

  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.src = 'https://freshinbox.xyz/favicon.ico';
  };

  const { bounce } = useCustomAnimation();

  // show sub command indicator instead of search icon in search box
  const SubCommandIndicator = (type?: CommandType) => {
    // get command icon

    let label = 'Switch Space';

    const cmdType = type || subCommand;

    console.log('🚀 ~ SubCommandIndicator ~ cmdType:', cmdType);

    const { Icon } = getCommandIcon(cmdType);

    if (cmdType === CommandType.NewSpace) {
      label = 'New Space';
    } else if (cmdType === CommandType.AddToSpace) {
      label = 'Move Tab';
    } else if (cmdType === CommandType.SwitchTab) {
      label = 'Switch Tab';
    } else if (cmdType === CommandType.SnoozeTab) {
      label = 'Snooze Tab';
    }

    return (
      <div className="flex items-center justify-start h-full border-r border-brand-darkBgAccent/50 pl-[9px] pr-[6.5px] mr-1.5 bg-brand-darkBgAccent/40">
        <Icon className=" fill-slate-600 text-slate-600 mr-1.5" size={14} />
        <p className="text-slate-400 text-[12px]  m-0 p-0 whitespace-nowrap">{label}</p>
      </div>
    );
  };

  // command section label
  const CommandSectionLabel = (index: number, cmdLabel: string) => {
    if (index < 1 || isStaticCommands(cmdLabel)) return;

    let sectionLabel = '';

    let Icon = FaLink;

    if (
      index ===
      suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchTab && staticCommands[0].label !== cmd1.label)
        ?.index
    ) {
      sectionLabel = 'Switch to opened tabs';
      Icon = FaArrowRight;
    } else if (index === suggestedCommands.find(cmd1 => cmd1.type === CommandType.RecentSite)?.index) {
      sectionLabel = 'Open recently visited sites';
    } else if (
      index ===
      suggestedCommands.find(cmd1 => cmd1.type === CommandType.SwitchSpace && staticCommands[1].label !== cmd1.label)
        ?.index
    ) {
      sectionLabel = 'Switch space';
      Icon = FaArrowRightFromBracket;
    }

    if (!sectionLabel) return;

    return (
      <>
        <div className="flex items-center justify-start gap-x-1 mt-1.5 ml-2.5 mb-1">
          <p key={index} className="text-[12.5px] font-light text-slate-500 " tabIndex={-1}>
            {sectionLabel}
          </p>
          <Icon className=" fill-slate-700 text-slate-700 ml-px" size={14} />
        </div>
        <hr key={index} className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0" tabIndex={-1} />
      </>
    );
  };

  // const CommandTypeLabel = (type: CommandType) => {
  //   // get command icon
  //   const { Icon, label } = getCommandIcon(type);

  //   return (
  //     <div className="flex items-center justify-start border-r border-brand-darkBgAccent/50 pl-[3px] pr-[4px] mr-1 bg-brand-darkBgAccent/30 ml-2 h-full">
  //       <Icon className=" fill-slate-600 text-slate-600 mr-1.5" size={12} />
  //       {/* <p className="text-slate-500 text-[10px]  m-0 p-0 whitespace-nowrap">{label}</p> */}
  //     </div>
  //   );
  // };

  // command component
  const Command = ({ index, label, icon: Icon }: ICommand) => {
    const isFocused = focusedCommandIndex === index;

    return (
      <button
        id={`fresh-tabs-command-${index}`}
        className={`w-full flex items-center justify-start px-[9px] py-[6px] outline-none first:pt-[7.5px]
        transition-all duration-200 ease-in ${isFocused ? 'bg-brand-darkBgAccent/50' : ''} `}
        onClick={() => onCommandClick(index)}
        style={{ height: COMMAND_HEIGHT + 'px' }}>
        {/* special commands */}

        {/* {!isStaticCommands(label) && type !== CommandType.WebSearch ? CommandTypeLabel(type) : null} */}

        <div className="w-[22px]">
          {typeof Icon === 'string' ? (
            !isValidURL(Icon) ? (
              <span className="w-[16px] h-fit text-start">{Icon}</span>
            ) : (
              <img
                alt="icon"
                src={Icon}
                onError={handleImageLoadError}
                className="w-[14px] h-fit object-left rounded-md opacity-95 object-scale-down"
              />
            )
          ) : (
            <Icon
              className="fill-slate-600 text-slate-500 w-[14px]  object-scale-down object-center"
              size={label !== 'Go to Tab' ? 16 : 14}
            />
          )}
        </div>
        <p
          className="text-[12px] text-start text-slate-400 font-light min-w-[50%] max-w-[95%] whitespace-nowrap  overflow-hidden text-ellipsis"
          dangerouslySetInnerHTML={{ __html: label }}></p>
      </button>
    );
  };

  const MostVisitedSites = () => {
    return (
      // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
      <div className="bg-brand-darkBg w-full" onClick={() => inputRef.current?.focus()}>
        <p className="text-[12px] text-slate-500 font-light mt-px ml-2.5 mb-1" tabIndex={-1}>
          Most Visited Sites
        </p>
        <hr className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0 mb-1" tabIndex={-1} />
        <div className="flex w-full items-center py-2 rounded-lg justify-around  px-2">
          {topSites?.map(site => (
            <Tooltip
              key={site.title}
              label={limitCharLength(site.title, 42)}
              delay={500}
              containerEl={suggestionContainerRef.current}>
              <button
                className={`bg-brand-darkBgAccent/80 rounded-md flex items-center justify-center outline-none p-1 px-1.5 
            border border-brand-darkBgAccent focus:border-slate-500/80 focus:bg-slate-700 transition-all duration-200 ease-in-out1`}>
                <img
                  alt="icon"
                  src={getFaviconURL(site.url, false)}
                  onError={handleImageLoadError}
                  className="w-[16px] h-[16px] object-scale-down object-center opacity-80"
                />
              </button>
            </Tooltip>
          ))}
        </div>
      </div>
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
        {...bounce}
        onClick={handleBackdropClick}
        // working on bigger screen
        // className=" m-0 flex items-center outline-none flex-col justify-center top-[20%] h-fit max-h-[75vh] w-[520px] max-w-[60%] left-[33.5%] backdrop:to-brand-darkBg/30 p-px bg-transparent">
        // smaller screen
        className=" m-0 flex items-center outline-none flex-col justify-center top-[22%] h-fit max-h-[75vh] w-[80%] max-w-[90%] mx-auto left-auto backdrop:to-brand-darkBg/30 p-px bg-transparent">
        {/* search box */}
        <div
          className={`w-full h-[50px] min-h-[50px]: bg-brand-darkBg rounded-xl  border-collapse overflow-hidden
             flex items-center justify-start  shadow-md shadow-slate-800 border border-slate-600/70`}>
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            className="flex items-center justify-center w-fit h-full bg-slate-60 rounded-tl-xl rounded-bl-xl"
            tabIndex={-1}
            onClick={handleSearchIconClick}
            role="img">
            {!subCommand ? (
              <MdSearch className="fill-slate-700 bg-transparent ml-2 mr-1.5" size={24} />
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
              if (ev.key === 'Backspace' && !searchQuery.trim()) {
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
          className={`bg-brand-darkBg w-full h-fit overflow-hidden overflow-y-auto cc-scrollbar mt-1 cc-scrollbar mx-auto shadow-sm rounded-md
                        rounded-bl-none rounded-br-none shadow-slate-800/70 border border-y-0 border-slate-600/60 border-collapse `}>
          {/* actions */}
          {suggestedCommands.length > 0 &&
            suggestedCommands?.map(cmd => {
              const renderCommands: JSX.Element[] = [];
              renderCommands.push(CommandSectionLabel(cmd.index, cmd.label));

              renderCommands.push(Command(cmd));

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
          {/* most visited sites */}
          {searchQuery.trim() === '' ? MostVisitedSites() : null}
        </div>

        {/* navigation guide */}
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions*/}
        <div
          className={`bg-slate-900 shadow-sm shadow-slate-800/70  w-full flex items-center justify-between px-3 py-2 select-none
                      rounded-bl-md rounded-br-md border-t border-brand-darkBgAccent/80   `}
          onClick={() => inputRef.current?.focus()}>
          <div className=" text-slate-600/90 text-[11px]">FreshTabs</div>
          <div className="gap-x-1  text-slate-600 text-[10px] flex items-center ">
            <span className="mr-2 flex items-center bg-brand-darkBgAccent/50 px-1.5 py-px pt-1 rounded-sm shadow-sm shadow-brand-darkBgAccent">
              <FaLongArrowAltUp className="text-slate-600 mr-[0.5px]" size={11} />
              <kbd>Up</kbd>
            </span>
            <span className="mr-2 flex items-center bg-brand-darkBgAccent/50 px-1.5 py-px pt-1 rounded-sm shadow-sm shadow-brand-darkBgAccent">
              <FaLongArrowAltUp className="text-slate-600 mr-[0.5px] rotate-180" size={11} />
              <kbd>Down</kbd>
            </span>
            <span className="mr-2 flex items-center bg-brand-darkBgAccent/50 px-1.5 py-px pt-1 rounded-sm shadow-sm shadow-brand-darkBgAccent">
              <MdOutlineKeyboardReturn className="text-slate-600 mr-1 font-medium -mb-px " size={16} />
              <kbd>Enter</kbd>
            </span>
          </div>
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
