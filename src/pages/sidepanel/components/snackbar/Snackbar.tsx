import { MdCancel, MdCheckCircle } from 'react-icons/md';
import Spinner from '../spinner';
import { useState, useEffect } from 'react';
import { wait } from '@root/src/pages/utils';
import { useAtom } from 'jotai';
import { snackbarAtom } from '@root/src/stores/app';

type Props = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

const Snackbar = ({ show, msg, isSuccess, isLoading }: Props) => {
  // snackbar local state
  const [isShown, setIsShown] = useState(false);

  // global snackbar state/atom

  const [, setSnackbar] = useAtom(snackbarAtom);

  useEffect(() => {
    (async () => {
      await wait(200);

      setIsShown(show);
    })();
  }, [show]);

  useEffect(() => {
    (async () => {
      if (isShown && !isLoading) {
        await wait(3500);
        setIsShown(false);
        await wait(200);
        setSnackbar({ show: false, msg: '' });
      }
    })();
  }, [isShown, isLoading, setSnackbar]);

  const bgColor = isLoading ? 'bg-sky-400' : isSuccess ? 'bg-emerald-300' : 'bg-rose-200';

  const RenderIcon = isSuccess ? <MdCheckCircle size={24} /> : <MdCancel size={24} />;

  return (
    <div
      className={`fixed bottom-4 left-0  h-5 w-fit items-center pl-2 pr-4 py-5 rounded-sm justify-start transition-all duration-200 ease-in ${bgColor}`}
      style={{
        display: show ? `flex` : `none`,
        // right: isShown ? `5%` : `-50%`,
        transform: `translateX(${isShown ? '10%' : '-100%'})`,
      }}>
      {/* icon/spinner */}
      <div className="mr-2">{isLoading ? <Spinner size="sm" /> : RenderIcon}</div>
      {/* msg */}
      <div
        className={`text-base font-medium text-slate-700  
      `}>
        {msg}
      </div>
    </div>
  );
};

export default Snackbar;
