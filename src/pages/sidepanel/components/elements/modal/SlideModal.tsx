import { useEffect, ReactNode, memo, useRef, KeyboardEventHandler } from 'react';
import { MdClose } from 'react-icons/md';
import { motion } from 'framer-motion';
import { wait } from '@root/src/pages/utils';

type Props = {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

const SlideModal = ({ children, isOpen, onClose }: Props) => {
  console.log('🚀 ~ SlideModal ~ onClose:', onClose);

  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const modalEl = modalRef.current;

    if (isOpen) {
      (async () => {
        modalEl.showModal();
      })();
    } else {
      (async () => {
        await wait(200);
        modalEl.close();
      })();
    }
  }, [isOpen]);

  // handle close
  const handleClose = async () => {
    await wait(200);
    onClose();
  };

  const handleKeyDown: KeyboardEventHandler<HTMLDialogElement> = ev => {
    console.log('🚀 ~ SlideModal ~ handleKeyDown:', ev.key);
    ev.stopPropagation();
    if (ev.key.toLowerCase() === 'escape') {
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

  return (
    <motion.dialog
      ref={modalRef}
      {...bounceDivAnimation}
      onKeyDown={handleKeyDown}
      className="w-full h-min min-h-[40%] bg-brand-darkBg px-1 py-1  backdrop:bg-brand-darkBg/20">
      <div className="overflow-hidden max-w-full pt-2 z-[99]">
        <MdClose className="absolute top-2 right-2 fill-slate-500 cursor-pointer" size={24} onClick={handleClose} />
        {children}
      </div>
    </motion.dialog>
  );

  // return (
  //   <div
  //     className="fixed z-50 h-screen w-screen top-0 left-0"
  //     style={{
  //       display: isOpen ? 'flex' : 'none',
  //     }}>
  //     {/* backdrop */}
  //     {/* eslint-disable-next-line */}
  //     <div className="z-[55] w-screen h-screen fixed bg-brand-darkBgAccent/30" onClick={handleClose}></div>
  //     {/* modal card */}
  //     <div
  //       className={`z-[60] absolute bottom-0 flex flex-col left-0 w-full h-min  mx-auto  min-h-[40%]  bg-slate-900 rounded-tl-3xl
  //                 rounded-tr-3xl transition-all duration-300  ease-in-out`}
  //       style={{
  //         transform: `translateY(${posY})`,
  //         display: isOpen ? 'flex' : 'none',
  //       }}>
  //       {/* <p className="text-base font-light text-slate-200 select-none text-center">{title}</p> */}
  //       {/* close btn */}
  //       <button
  //         className="absolute top-1.5 select-none right-3 text-slate-500 hover:opacity-90 transition-all duration-200"
  //         onClick={handleClose}>
  //         <MdClose size={26} className="" />
  //       </button>
  //       {isOpen ? children : null}
  //     </div>
  //   </div>
  // );
};

export default memo(SlideModal);
