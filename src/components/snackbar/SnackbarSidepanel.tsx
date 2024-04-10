import { useAtom } from 'jotai';
import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircledIcon, CrossCircledIcon } from '@radix-ui/react-icons';

import Spinner from '../spinner';
import { cn } from '@root/src/utils/cn';
import { snackbarAtom } from '@root/src/stores/app';
import { useCustomAnimation } from '@root/src/pages/sidepanel/hooks/useCustomAnimation';

const Snackbar = () => {
  // global snackbar state/atom

  const [{ isLoading, isSuccess, show, msg }, setSnackbarState] = useAtom(snackbarAtom);

  const textColor = isLoading ? 'text-sky-400' : isSuccess ? 'text-emerald-300' : 'text-rose-400';

  const borderColor = isLoading ? 'border-sky-400/40' : isSuccess ? 'border-emerald-300/40' : 'border-rose-400/40';

  const RenderIcon = isSuccess ? (
    <CheckCircledIcon className={cn('opacity-70 scale-[1]', textColor)} />
  ) : (
    <CrossCircledIcon className={cn('opacity-70 scale-[1]', textColor)} />
  );

  //  set timer to remove snackbar after 3s
  useEffect(() => {
    setTimeout(() => {
      setSnackbarState({ show: false, isLoading: false, isSuccess: false, msg: '' });
    }, 3000);
  }, []);

  const { bounceWithTranslateXFull } = useCustomAnimation();

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          {...bounceWithTranslateXFull}
          key={'snackbar-container'}
          className={cn(
            'fixed select-none z-[160] bottom-[6%] left-1/2 border flex items-center justify-center w-fit -translate-x-1/2 pl-2 pr-4 py-2 rounded-md  bg-brand-darkBgAccent',
            borderColor,
          )}>
          {/* icon/spinner */}
          <div>{isLoading ? <Spinner size="sm" /> : RenderIcon}</div>
          {/* msg */}
          <div className={cn('text-[12px] -mt-px  flex items-center select-none ml-1.5', textColor)}>{msg}</div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
};

export default Snackbar;
