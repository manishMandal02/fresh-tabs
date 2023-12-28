import { wait } from '@root/src/pages/utils';
import { useEffect, useState, ReactNode } from 'react';
import { MdClose } from 'react-icons/md';

type Props = {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

const Modal = ({ children, isOpen, onClose, title }: Props) => {
  const [posY, setPosY] = useState('100%');
  useEffect(() => {
    if (isOpen) {
      (async () => {
        await wait(100);
        setPosY('0px');
      })();
    }
  }, [isOpen]);

  // handle close
  const handleClose = async () => {
    setPosY('100%');
    await wait(200);
    onClose();
  };

  return (
    <div
      className="fixed z-50 h-screen w-screen top-0 left-0"
      style={{
        display: isOpen ? 'flex' : 'none',
      }}>
      {/* backdrop */}
      {/* eslint-disable-next-line */}
      <div className="z-[55] w-screen h-screen fixed bg-slate-500/10" onClick={handleClose}></div>
      {/* modal card */}
      <div
        className={`z-[60] absolute bottom-0 flex flex-col left-0 w-full h-min  mx-auto  min-h-[40%]  bg-slate-800 rounded-tl-3xl 
                  border-t border-slate-700 rounded-tr-3xl transition-all duration-300  ease-in-out`}
        style={{
          transform: `translateY(${posY})`,
          display: isOpen ? 'flex' : 'none',
        }}>
        <div className="shadow-sm shadow-slate-700 relative  py-1.5">
          <p className="text-base font-light text-slate-200 select-none text-center">{title}</p>
          {/* close btn */}
          <button
            className="absolute top-1.5 select-none right-3 text-slate-500 hover:opacity-90 transition-all duration-200 "
            onClick={handleClose}>
            <MdClose size={26} className="" />
          </button>
        </div>
        {isOpen ? children : null}
      </div>
    </div>
  );
};

export default Modal;
