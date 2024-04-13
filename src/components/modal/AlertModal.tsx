import { useEffect, ReactNode, memo, useRef, KeyboardEventHandler, MouseEventHandler } from 'react';
import { Cross1Icon } from '@radix-ui/react-icons';
import { AnimatePresence, motion } from 'framer-motion';

import { useCustomAnimation } from '../../pages/sidepanel/hooks/useCustomAnimation';
// import { MdClose } from 'react-icons/md';

type Props = {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  showCloseBtn?: boolean;
};

const AlertModal = ({ children, isOpen, onClose, title, showCloseBtn = true }: Props) => {
  // dialog ref
  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modalEl = modalRef.current;

    if (isOpen) {
      (async () => {
        modalEl?.showModal();
      })();
    } else {
      modalEl?.close();
    }
  }, [isOpen]);

  // handle close
  const handleClose = async () => {
    onClose();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDialogElement> = ev => {
    ev.stopPropagation();
    if (ev.key.toLowerCase() === 'escape') {
      handleClose();
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
      dialogEl.close();
      handleClose();
    }
  };

  const { bounce } = useCustomAnimation();

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.dialog
          ref={modalRef}
          {...bounce}
          onKeyDown={handleKeyDown}
          onClick={handleBackdropClick}
          className="w-screen h-min  bg-brand-darkBg px-1 py-1 border-t border-brand-darkBgAccent/70 backdrop:bg-brand-darkBgAccent/10 fixed top-2 rounded-lg shadow-md shadow-brand-darkBgAccent/70">
          <div className="overflow-hidden w-full pt-1 z-[99] rounded-lg">
            {/* header */}
            <div className="w-full relative mb-2 shadow-sm shadow-brand-darkBgAccent/40">
              {title ? <p className="text-center text-slate-500 text-[14px] font-light pb-1">{title}</p> : null}
              {showCloseBtn ? (
                <Cross1Icon
                  className="absolute  top-px right-2 fill-slate-700/90 cursor-pointer font-thin hover:fill-slate-600/90 transition-all duration-300 ease-in-out"
                  onClick={handleClose}
                />
              ) : null}
            </div>
            {children}
          </div>
        </motion.dialog>
      ) : null}
    </AnimatePresence>
  );
};

export default memo(AlertModal);
