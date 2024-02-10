import { MdNewLabel, MdSearch, MdSwitchLeft } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useEffect, useRef, MouseEventHandler, ReactEventHandler } from 'react';
import type { IconType } from 'react-icons/lib';

import { getFaviconURL } from '../../utils';
import { ITab } from '../../types/global.types';
import { useKeyPressed } from '../../sidepanel/hooks/useKeyPressed';
import { CommandPaletteContainerId } from '@root/src/constants/app';

type Props = {
  recentSites: ITab[];
  topSites: ITab[];
};

const CommandPalette = ({ recentSites, topSites }: Props) => {
  const spaceCommands = [
    { label: 'New Space', icon: MdNewLabel },
    { label: 'Switch Space', icon: MdSwitchLeft },
  ];

  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ useEffect: 🎉🎉');
    modalRef.current?.showModal();
    inputRef.current?.focus();
  }, [recentSites]);

  const handleSearchIconClick = () => {
    inputRef.current?.focus();
  };

  useKeyPressed({
    onEscapePressed: () => {
      handleCloseCommandPalette();
    },
  });

  const handleCloseCommandPalette = () => {
    modalRef.current?.close();
    // remove parent container
    const container = document.getElementById(CommandPaletteContainerId);
    if (container) {
      container.remove();
    }
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

  const handleImageLoadError: ReactEventHandler<HTMLImageElement> = ev => {
    ev.stopPropagation();
    ev.currentTarget.src = 'https://freshinbox.xyz/favicon.ico';
  };

  const Command = (label: string, Icon?: IconType | string, onSelect?: () => void) => {
    return (
      <button
        className="w-full flex items-center justify-start px-3 py-[7px] outline-none focus:bg-brand-darkBgAccent/70 transition-all duration-300 ease-in-out"
        onClick={onSelect}>
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
    <div className="w-screen h-screen flex items-center justify-center fixed top-0 left-0 overflow-hidden">
      <motion.dialog
        aria-modal
        ref={modalRef}
        {...bounceDivAnimation}
        onClick={handleBackdropClick}
        className="absolute m-0  top-[20%] h-fit w-[520px] left-[33.5%] backdrop:to-brand-darkBg/30 p-px bg-transparent">
        {/* backdrop*/}
        {/* <div className="w-screen h-screen bg-brand-darkBg/30 z-[999999]  fixed top-0 left-0"></div> */}

        <div
          className={`w-full h-[50px] bg-brand-darkBg rounded-xl flex items-center justify-start overflow-hidden
                    shadow-lg shadow-slate-800 border border-slate-600/70`}>
          {/* search box */}
          <button
            className="flex items-center justify-center outline-none border-none ring-0 w-[8%] py-2.5 bg-slate-60 rounded-tl-xl rounded-bl-xl pl-[6px] pr-[3px]"
            tabIndex={-1}
            onClick={handleSearchIconClick}>
            <MdSearch className="fill-slate-700 bg-transparent -mb-px" size={24} />
          </button>
          <input
            ref={inputRef}
            type="text"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="text-[18px] text-slate-300  w-[92%] px-px  py-2.5 bg-transparent rounded-tr-xl caret-slate-200 caret rounded-br-xl outline-none border-none bg-indigo-20"
          />
        </div>
        {/* search suggestions and result */}
        <div className="bg-brand-darkBg shadow-sm w-full mx-auto overflow-hidden shadow-slate-800/80 border border-slate-600/60 mt-2 rounded-xl">
          {/* actions */}
          {/* create space */}
          <div>
            {spaceCommands.map(cmd => (
              <>{Command(cmd.label, cmd.icon)}</>
            ))}
          </div>

          <hr className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0" tabIndex={-1} />

          {/* recently visited sites */}
          <div className="w-full">
            <p className="text-slate-600 text-[13px] font-thin ml-2 mt-1 ">Recent visits</p>
            {recentSites?.map(site => <>{Command(site.title, getFaviconURL(site.url, false))}</>)}
          </div>

          <hr className="h-px bg-brand-darkBgAccent border-none w-full m-0 p-0" tabIndex={-1} />

          {/* most visited sites */}
          <div className=" mb-1">
            <p className="text-slate-600 text-[13px] font-thin ml-2 mt-1 pb-px">Most visited</p>
            <div className="flex w-full items-center justify-around px-2 py-1 mt-px">
              {topSites?.map(site => (
                <button
                  key={site.url}
                  className="bg-brand-darkBgAccent rounded-md flex items-center justify-center outline-none p-1 px-1.5 border border-brand-darkBgAccent focus:border-slate-500/80 focus:bg-slate-700 transition-all duration-200 ease-in-out">
                  <img
                    alt="icon"
                    src={getFaviconURL(site.url, false)}
                    onError={handleImageLoadError}
                    className="w-[18px] h-[18px] object-scale-down object-center"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
