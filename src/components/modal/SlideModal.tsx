import { ReactNode, memo } from 'react';
import { Cross1Icon } from '@radix-ui/react-icons';
import { motion } from 'framer-motion';
import { useCustomAnimation } from '../../pages/sidepanel/hooks/useCustomAnimation';
import { useHotkeys } from 'react-hotkeys-hook';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
};

const SlideModal = ({ children, isOpen, onClose, title }: Props) => {
  useHotkeys(
    'escape',
    () => {
      onClose();
    },
    [onClose],
    { enableOnFormTags: true, enableOnContentEditable: true },
  );

  const { slide, fade } = useCustomAnimation();

  return isOpen ? (
    <motion.div {...slide} className="fixed z-[999] h-screen w-screen top-0 left-0 !overflow-hidden">
      {/* backdrop */}
      {/* eslint-disable-next-line */}
      <motion.div
        {...fade}
        className="z-[9999] w-screen h-screen fixed bg-brand-darkBg/25"
        onClick={onClose}></motion.div>
      {/* modal card */}
      <div
        className={`z-[99999] absolute bottom-0 flex flex-col left-0 w-full min-h-[28%] max-h-[90%] bg-brand-darkBg rounded-tl-3xl rounded-tr-3xl
                border-t border-brand-darkBgAccent transition-all duration-300  ease-in-out pb-1 shadow-md shadow-brand-darkBgAccent/60`}>
        <div className="shadow-sm shadow-brand-darkBgAccent/50 relative  py-2.5 px-3.5 min-h-8 flex items-center justify-between">
          <span className="invisible"></span>
          <p className="text-[15px] font-light  text-slate-400/80 select-none text-center">{title}</p>
          {/* close btn */}
          <button
            className="select-none text-slate-600 hover:opacity-90 transition-all duration-200 "
            onClick={onClose}>
            <Cross1Icon className="scale-[1] " />
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
