import { ReactNode, memo } from 'react';
import { Cross1Icon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';
import { useCustomAnimation } from '../../../hooks/useAnimation';
import { useKeyPressed } from '../../../hooks/useKeyPressed';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const SlideModal = ({ children, isOpen, onClose, title }: Props) => {
  // handle close
  const handleClose = async () => {
    onClose();
  };

  useKeyPressed({
    onEscapePressed: () => {
      handleClose();
    },
  });

  const { slide } = useCustomAnimation();

  return isOpen ? (
    <motion.div {...slide} className="fixed z-[999] h-screen w-screen top-0 left-0">
      {/* backdrop */}
      {/* eslint-disable-next-line */}
      <div className="z-[9999] w-screen h-screen fixed bg-brand-darkBg/20" onClick={handleClose}></div>
      {/* modal card */}
      <div
        className={`z-[99999] absolute bottom-0 flex flex-col left-0 w-full min-h-[40%] bg-brand-darkBg rounded-tl-3xl rounded-tr-3xl
                         border-t border-brand-darkBgAccent/30 transition-all duration-300  ease-in-out pb-2`}>
        <div className="shadow-sm shadow-brand-darkBgAccent/30 relative  py-2 min-h-8">
          <p className="text-[14px] font-light text-slate-400/80 select-none text-center">{title}</p>
          {/* close btn */}
          <button
            className="absolute top-3 select-none right-4 text-slate-500/80 hover:opacity-90 transition-all duration-200 "
            onClick={handleClose}>
            <Cross1Icon className="scale-[1]" />
          </button>
        </div>
        {children}
      </div>
    </motion.div>
  ) : (
    <></>
  );
};

export default memo(SlideModal);
