import { AnimatePresence, motion } from 'framer-motion';
import { Cross1Icon } from '@radix-ui/react-icons';
import { useEffect } from 'react';
import { useFrame } from 'react-frame-component';
import { useCustomAnimation } from '../../sidepanel/hooks/useCustomAnimation';

type Props = {
  onClose: () => void;
  title: string;
  contentBody: string;
  onLoad: () => void;
};

const ReadingMode = ({ title, contentBody, onLoad, onClose }: Props) => {
  const { document } = useFrame();

  document.body.addEventListener('keydown', ev => {
    console.log('🚀 ~ file: ReadingMode.tsx:16 ~ ReadingMode ~ ev:', ev);

    if (ev.code !== 'Escape') return;

    onClose();
  });

  useEffect(() => {
    setTimeout(() => {
      // initialize link preview
      onLoad();
      const reader = document.querySelector('.cc-reader') as HTMLDivElement;

      if (!reader) return;

      reader.focus();
    }, 500);
  }, [document]);

  const { fade } = useCustomAnimation();

  return (
    <AnimatePresence>
      <motion.div
        tabIndex={-1}
        {...fade}
        className="fixed w-full h-full bg-brand-darkBg  flex items-start justify-center overflow-y-auto cc-scrollbar cc-reader outline-none">
        {/* controls */}
        <div className="absolute top-3 right-4">
          <button
            onClick={onClose}
            className="border border-slate-500/80 rounded px-2 py-1.5 group hover:border-slate-500 transition-colors duration-200">
            <Cross1Icon className="text-slate-500/80 scale-150 stroke-2 group-hover:text-slate-500 transition-colors duration-200" />
          </button>
        </div>
        {/* content */}
        <main className="h-full w-[60%] max-w-[60%] 2xl:max-w-[46%] py-4">
          {/* title */}
          <h1 className="!text-slate-300 !text-[36px] !font-medium tracking-wide max-w-[80%] 2xl:max-w-[98%] whitespace-pre-wrap">
            {title}
          </h1>
          {/* body */}
          <section
            className="!text-slate-300/90 pt-4 pb-10 max-w-[100%]"
            dangerouslySetInnerHTML={{ __html: contentBody }}></section>
          <hr className="w-[55%] border-[1px] !border-slate-700/90 rounded-md -mt-6 -ml-4 mx-auto" />
        </main>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReadingMode;
