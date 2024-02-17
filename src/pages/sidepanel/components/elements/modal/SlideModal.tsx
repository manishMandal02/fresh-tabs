import { useEffect, ReactNode, memo, useRef, KeyboardEventHandler, MouseEventHandler } from 'react';
import { MdClose } from 'react-icons/md';
import { motion } from 'framer-motion';

type Props = {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

const SlideModal = ({ children, isOpen, onClose, title }: Props) => {
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

  const bounceDivAnimation = {
    initial: { scale: 0, opacity: 0 },
    whileInView: {
      scale: 1,
      opacity: 1,
    },
    exit: { scale: 0, opacity: 0 },
    transition: { type: 'spring', stiffness: 900, damping: 40 },
  };

  return isOpen ? (
    <motion.dialog
      ref={modalRef}
      {...bounceDivAnimation}
      onKeyDown={handleKeyDown}
      onClick={handleBackdropClick}
      className="w-screen h-min  bg-brand-darkBg px-1 py-1  backdrop:bg-brand-darkBg/25 fixed top-2 rounded-lg shadow shadow-brand-darkBgAccent">
      <div className="overflow-hidden w-full pt-1 z-[99] rounded-lg">
        <div className="w-full relative mb-3">
          {title ? <h2 className="text-center text-slate-500/80 text-base font-light ">{title}</h2> : null}
          <MdClose
            className="absolute top-px right-2 fill-slate-700/90 cursor-pointer font-thin hover:fill-slate-600/90 transition-all duration-300 ease-in-out"
            size={26}
            onClick={handleClose}
          />
        </div>
        {children}
      </div>
    </motion.dialog>
  ) : (
    <></>
  );
};

export default memo(SlideModal);
