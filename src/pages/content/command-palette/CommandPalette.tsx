import { useEffect, useRef } from 'react';
import { MdSearch } from 'react-icons/md';
import { useKeyPressed } from '../../sidepanel/hooks/useKeyPressed';
import { CommandPaletteContainerId } from '@root/src/constants/app';

const CommandPalette = () => {
  const modalRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    console.log('🚀 ~ CommandPalette ~ useEffect: 🎉🎉');
    console.log('🚀 ~ useEffect ~ modalRef:', modalRef);
    modalRef.current?.showModal();
    inputRef.current?.focus();
  }, []);

  const handleSearchIconClick = () => {
    inputRef.current?.focus();
  };

  useKeyPressed({
    onEscapePressed: () => {
      modalRef.current?.close();
      // remove parent container
      const container = document.getElementById(CommandPaletteContainerId);
      if (container) {
        container.remove();
      }
    },
  });

  return (
    <div className="w-screen h-screen flex items-center justify-center fixed top-0 left-0">
      <dialog
        ref={modalRef}
        className="relative m-0  top-[20%] left-1/2 -translate-x-1/2 backdrop:to-brand-darkBg/50 bg-red-200 rounded-full">
        {/* backdrop*/}
        {/* <div className="w-screen h-screen bg-brand-darkBg/30 z-[999999]  fixed top-0 left-0"></div> */}

        <div
          className={`w-[520px] h-[50px] bg-brand-darkBg rounded-full flex items-center justify-start overflow-hidden
                    shadow-md shadow-brand-darkBgAccent/80 border border-brand-darkBg/40`}>
          {/* search box */}
          <button
            className="flex items-center justify-center outline-none border-none ring-0 w-[8%] py-2.5 bg-slate-60 rounded-tl-full rounded-bl-full pl-[6px] pr-[3px]"
            tabIndex={-1}
            onClick={handleSearchIconClick}>
            <MdSearch className="fill-slate-700 bg-transparent -mb-px" size={24} />
          </button>
          <input
            ref={inputRef}
            type="text"
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
            className="text-[18px] text-slate-300  w-[92%] px-px  py-2.5 bg-transparent rounded-tr-full caret-slate-200 caret rounded-br-full outline-none border-none bg-indigo-20"
          />
        </div>
        {/* search suggestions and result */}
      </dialog>
    </div>
  );
};

export default CommandPalette;
