import { MdSearch } from 'react-icons/md';
import { motion } from 'framer-motion';
import { useEffect, useRef, MouseEventHandler, useState } from 'react';

import { useKeyPressed } from '../../sidepanel/hooks/useKeyPressed';
import { CommandPaletteContainerId } from '@root/src/constants/app';
import { ITab } from '../../types/global.types';
import type { IconType } from 'react-icons/lib';
import { getFaviconURL } from '../../utils';

type Props = {
  recentSitesPayload: ITab[];
};

const CommandPalette = ({ recentSitesPayload }: Props) => {
  const [recentSites, setRecentSites] = useState<ITab[]>();

  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ useEffect: 🎉🎉');
    console.log('🚀 ~ useEffect ~ modalRef:', modalRef);
    console.log('🚀 ~ useEffect ~ recentSitesPayload:', recentSitesPayload);
    setRecentSites(recentSitesPayload);
    modalRef.current?.showModal();
    inputRef.current?.focus();
  }, [recentSitesPayload]);

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

  const Command = (label: string, icon?: IconType | string, onSelect?: () => void) => {
    return (
      <button className="w-full flex items-center justify-start px-3 py-1.5" onClick={onSelect}>
        <div className="w-[5%]">
          {typeof icon === 'string' ? (
            <img
              alt="icon"
              src={icon}
              className="w-5 h-fit max-h-4 object-contain object-left rounded-full opacity-95"
            />
          ) : (
            <span> {icon ? { icon } : null}</span>
          )}
        </div>
        <p className=" text-[14px] text-slate-300 font-light min-w-[50%] max-w-[85%] whitespace-nowrap  overflow-hidden text-ellipsis">
          {label}
        </p>
      </button>
    );
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center fixed top-0 left-0">
      <motion.dialog
        ref={modalRef}
        {...bounceDivAnimation}
        onClick={handleBackdropClick}
        className="relative m-0  top-[20%] h-fit w-[520px] left-[33.5%] backdrop:to-brand-darkBg/30 p-px bg-transparent">
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
        <div className=" bg-brand-darkBg shadow-sm w-full mx-auto overflow-hidden shadow-slate-800/80 border border-slate-600/60 mt-2 rounded-xl">
          {/* actions */}
          <div>{/* create space */}</div>

          {/* recently visited sites */}
          <div className="w-full">{recentSites?.map(site => <>{Command(site.title, getFaviconURL(site.url))}</>)}</div>

          {/* top sites (fav) */}
          <div></div>
        </div>
      </motion.dialog>
    </div>
  );
};

export default CommandPalette;
