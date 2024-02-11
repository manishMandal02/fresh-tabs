import { MdNewLabel, MdSearch, MdSwitchLeft } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useEffect, useRef, MouseEventHandler, ReactEventHandler, useState, useCallback } from 'react';
import type { IconType } from 'react-icons/lib';

import { getFaviconURL } from '../../utils';
import { ITab } from '../../types/global.types';
import { useKeyPressed } from '../../sidepanel/hooks/useKeyPressed';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import Tooltip from '../../sidepanel/components/elements/tooltip';
import { publishEvents } from '../../utils/publish-events';

type Command = {
  index: number;
  type: 'static' | 'recent-site' | 'top-site' | 'divider';
  label: string;
  icon?: string | IconType;
};

const staticCommands: Command[] = [
  { index: 1, type: 'static', label: 'Switch Space', icon: MdSwitchLeft },
  { index: 2, type: 'static', label: 'New Space', icon: MdNewLabel },
];

const commandDivider: Command = {
  index: -1,
  label: 'divider',
  type: 'divider',
};

type Props = {
  recentSites: ITab[];
  topSites: ITab[];
};

const CommandPalette = ({ recentSites, topSites }: Props) => {
  // local state
  // search query
  const [searchQuery, setSearchQuery] = useState('');

  // search/commands suggestions
  const [suggestedCommands, setSuggestedCommands] = useState<Command[]>([]);

  const [focusedCommandIndex, setFocusedCommandIndex] = useState(0);

  const [commandPaletteContainerEl, setCommandPaletteContainerEl] = useState<HTMLElement | null>(null);

  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ useEffect: 🎉🎉');
    modalRef.current?.showModal();
    inputRef.current?.focus();

    const recentSitesCommands = recentSites.map<Command>((site, idx) => ({
      index: 1 + idx + staticCommands.length,
      type: `recent-site`,
      label: site.title,
      icon: site.url,
    }));

    setSuggestedCommands([...staticCommands, commandDivider, ...recentSitesCommands]);

    const containerEl = document.getElementById(CommandPaletteContainerId);
    if (containerEl) {
      setCommandPaletteContainerEl(containerEl);
    }
  }, [recentSites, topSites]);

  const handleSearchIconClick = () => {
    inputRef.current?.focus();
  };

  const handleCloseCommandPalette = () => {
    modalRef.current?.close();
    // remove parent container
    commandPaletteContainerEl?.remove();
    document.body.style.overflow = 'auto';
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

  const bounceDivAnimation = {
    initial: { scale: 0, opacity: 0 },
    whileInView: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40 },
  };

  const focusSuggestedCommand = useCallback(
    (index: number) => {
      const selectedEl = commandPaletteContainerEl?.shadowRoot.querySelector(`button#fresh-tabs-command-${index}`);

      if (!selectedEl) return;

      (selectedEl as HTMLButtonElement).focus();
    },
    [commandPaletteContainerEl],
  );

  useEffect(() => {
    if (focusedCommandIndex === 0) {
      // focus input
      inputRef.current.focus();
    }

    // focus command
    focusSuggestedCommand(focusedCommandIndex);

    // set search
    if (focusedCommandIndex > 2) {
      const command = suggestedCommands.find(cmd => cmd.index === focusedCommandIndex);
      setSearchQuery(command.icon as string);
    } else {
      setSearchQuery('');
    }
  }, [focusedCommandIndex, focusSuggestedCommand, suggestedCommands]);

  // handle key press
  useKeyPressed({
    parentConTainerEl: modalRef.current,
    monitorModifierKeys: false,
    onEscapePressed: () => {
      handleCloseCommandPalette();
    },
    onTabPressed: () => {
      (async () => {
        await handleSelectCommand();
      })();
    },
    onEnterPressed: () => {
      (async () => {
        await handleSelectCommand();
      })();
    },
    onArrowDownPressed: () => {
      if (focusedCommandIndex === 0) {
        setFocusedCommandIndex(1);
        return;
      }

      if (focusedCommandIndex < 1) {
        return;
      }

      if (focusedCommandIndex === suggestedCommands.filter(c => c.type !== 'divider').length) return;

      setFocusedCommandIndex(prev => prev + 1);
    },
    onArrowUpPressed: () => {
      if (focusedCommandIndex < 1) {
        return;
      }

      setFocusedCommandIndex(prev => prev - 1);
    },
  });

  // handle select command
  const handleSelectCommand = async () => {
    const focusedCommand = suggestedCommands.find(cmd => cmd.index === focusedCommandIndex);

    console.log('🚀 ~ handleSelectCommand ~ suggestedCommands:', suggestedCommands);

    console.log('🚀 ~ handleSelectCommand ~ focusedCommand:', focusedCommand);

    if (!focusedCommand?.type) return;

    switch (focusedCommand.type) {
      case 'static': {
        if (focusedCommandIndex === 0) {
          await publishEvents({ event: 'SWITCH_SPACE', payload: { spaceId: '' } });
        }
        if (focusedCommandIndex === 1) {
          await publishEvents({ event: 'NEW_SPACE', payload: { spaceTitle: searchQuery } });
        }
        break;
      }
      case 'recent-site': {
        await publishEvents({ event: 'GO_TO_URL', payload: { url: focusedCommand.icon as string } });
        break;
      }
    }
  };

  const onCommandClick = async (index: number) => {
    setFocusedCommandIndex(index);
    await handleSelectCommand();
  };

  // handle fallback image for favicon icons
  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.src = 'https://freshinbox.xyz/favicon.ico';
  };

  const Command = (index: number, label: string, Icon?: IconType | string) => {
    return (
      <button
        id={`fresh-tabs-command-${index}`}
        className="w-full flex items-center justify-start px-3 py-[7px] outline-none focus:bg-brand-darkBgAccent/70 transition-all duration-200 ease-in"
        onClick={() => onCommandClick(index)}>
        <div className="w-[5%]">
          {typeof Icon === 'string' ? (
            <img
              alt="icon"
              src={Icon}
              onError={handleImageLoadError}
              className="w-5 h-fit max-h-4 object-left rounded-full opacity-95 object-scale-down"
            />
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
        className="absolute m-0 flex flex-col justify-center top-[20%] h-fit w-[520px] left-[33.5%] backdrop:to-brand-darkBg/30 p-px bg-transparent">
        {/* most visited sites */}
        <div className="mb-[8px]  overflow-hidden w-[98%] mx-auto ">
          <p className="text-slate-500 text-[11px] font-thin m-0 bg-brand-darkBg px-3 py-px mx-auto rounded-tr-lg -mb-1 rounded-tl-lg w-fit text-center">
            Most visited
          </p>
          <div className="flex w-full items-center py-2 rounded-lg justify-around bg-brand-darkBg px-2">
            {topSites?.map(site => (
              <Tooltip key={site.url} label={site.title} delay={500}>
                <button className="bg-brand-darkBgAccent rounded-md flex items-center justify-center outline-none p-1 px-1.5 border border-brand-darkBgAccent focus:border-slate-500/80 focus:bg-slate-700 transition-all duration-200 ease-in-out">
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
          <button
            className="flex items-center justify-center outline-none border-none ring-0 w-[7%] py-2.5 bg-slate-60 rounded-tl-xl rounded-bl-xl pl-[6px] pr-[3px]"
            tabIndex={-1}
            onClick={handleSearchIconClick}>
            <MdSearch className="fill-slate-700 bg-transparent -mb-px" size={24} />
          </button>
          <input
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            ref={inputRef}
            onChange={ev => setSearchQuery(ev.currentTarget.value)}
            type="text"
            value={searchQuery}
            className="text-[14px] text-slate-300  w-[90%] px-px  py-2.5 bg-transparent rounded-tr-xl caret-slate-300 caret rounded-br-xl outline-none border-none bg-indigo-20"
          />
        </div>
        {/* search suggestions and result */}
        <div className="bg-brand-darkBg shadow-sm w-full mx-auto overflow-hidden shadow-slate-800/80 border mt-1 border-t-0 border-slate-600/60 border-collapse rounded-xl">
          {/* actions */}
          <div>
            {suggestedCommands.map(cmd => {
              if (cmd.type === 'static') {
                return <>{Command(cmd.index, cmd.label, cmd.icon)}</>;
              }

              if (cmd.type === 'recent-site') {
                return <>{Command(cmd.index, cmd.label, cmd.icon)}</>;
              }

              return (
                <hr key={cmd.index} className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0" tabIndex={-1} />
              );
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
