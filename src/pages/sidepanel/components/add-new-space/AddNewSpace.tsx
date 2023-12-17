import { ThemeColor } from '@root/src/pages/types/global.types';
import ColorPicker from '../color-picker';
import EmojiPicker from '../emoji-picker';
import Modal from '../modal';
import { useState } from 'react';

const AddNewSpace = () => {
  const [isModalOpen, setIsModalOpen] = useState(true);
  // handle create space
  const handleCreateSpace = () => {
    setIsModalOpen(true);
  };
  return (
    <>
      <button
        className="w-full border border-slate-700 text-xl font-light  text-slate-700 flex items-center justify-center rounded-md py-1.5 hover:border-slate-700/80 hover:text-slate-700/80 transition-all duration-200"
        onClick={handleCreateSpace}>
        +
      </button>
      {/* modal */}
      <Modal title="Add New Space" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col  w-full h-full py-2.5 px-6">
          <div className="mt-4 flex items-center gap-x-4">
            <input
              type="text"
              className="rounded bg-slate-600  px-2 py-1 text-[1rem] text-slate-100 w-48 outline-slate-600"
              placeholder="Space Title..."
            />
            <EmojiPicker emoji="😀" onChange={() => {}} />
            <ColorPicker color={ThemeColor.blue} onChange={() => {}} />
          </div>

          {/* tabs */}
          <div className="mt-3">
            <span className="w-full"></span>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default AddNewSpace;
