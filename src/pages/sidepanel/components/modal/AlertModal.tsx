import { MouseEventHandler, ReactNode } from 'react';
import { MdClose } from 'react-icons/md';

type Props = {
  children?: ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
};

const AlertModal = ({ children, isOpen, onClose, title }: Props) => {
  // close modal
  const handleClose: MouseEventHandler = ev => {
    ev.stopPropagation();
    onClose();
  };

  return (
    <div
      className="fixed z-100 h-screen w-screen top-0 left-0"
      style={{
        display: isOpen ? 'flex' : 'none',
      }}>
      {/* backdrop */}
      {/* eslint-disable-next-line */}
      <div className="z-[105] w-screen h-screen fixed bg-slate-800/50" onClick={handleClose}></div>
      {/* modal card */}
      <div
        className={`z-[110] absolute top-[0px] flex flex-col left-1/2 -translate-x-1/2 w-[90%]    mx-auto h-[20%] rounded-md  bg-slate-900/95 
                border-t border-slate-700 transition-all duration-300  ease-in-out`}>
        <div className="shadow-sm shadow-slate-700 relative  py-2">
          <p className="text-sm font-light text-slate-200 select-none text-center">{title}</p>
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

export default AlertModal;