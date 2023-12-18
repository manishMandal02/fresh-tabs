import { useState, useEffect, ChangeEventHandler } from 'react';
import Modal from '../../modal';
import { ISpace } from '@root/src/pages/types/global.types';
import ColorPicker from '../../color-picker';
import EmojiPicker from '../../emoji-picker';

type Props = {
  space: ISpace;
  onClose: () => void;
  isOpen: boolean;
};

const UpdateSpace = ({ space, onClose, isOpen }: Props) => {
  const [errorMsg, setErrorMsg] = useState('');

  // update space data
  const [updateSpaceData, setUpdateSpaceData] = useState<ISpace | null>(null);

  useEffect(() => {
    console.log('🚀 ~ file: UpdateSpace.tsx:23 ~ useEffect ~ space:', space);

    setUpdateSpaceData(space);
  }, [space]);

  // on title change
  const onTitleChange: ChangeEventHandler<HTMLInputElement> = ev => {
    setUpdateSpaceData(prev => ({ ...prev, title: ev.target.value }));
  };
  // on emoji change
  const onEmojiChange = (emoji: string) => {
    setUpdateSpaceData(prev => ({ ...prev, emoji }));
  };

  // create space
  const handleUpdateSpace = () => {
    setErrorMsg('');
    if (!updateSpaceData.emoji || !updateSpaceData.title || !updateSpaceData.theme || updateSpaceData.tabs.length < 1) {
      setErrorMsg('Fill all the fields');
      return;
    }
    // TODO - create space
  };

  return (
    <Modal title="Update Space" isOpen={isOpen} onClose={onClose}>
      {isOpen ? (
        <div>
          <div className="mt-4 flex items-center gap-x-3">
            <input
              type="text"
              className="rounded bg-slate-700  px-2.5 py-1.5 text-[1rem] text-slate-200 w-48 outline-slate-600"
              placeholder="Space Title..."
              value={updateSpaceData.title}
              onChange={onTitleChange}
            />
            <EmojiPicker emoji={updateSpaceData.emoji} onChange={onEmojiChange} />
            <ColorPicker color={updateSpaceData.theme} onChange={() => {}} />
          </div>

          {/* tabs */}
          <div className="mt-6">
            <p className="text-slate-600 font text-base">{updateSpaceData.tabs.length} tabs in space</p>
          </div>
          {/* error msg */}
          {errorMsg ? (
            <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
              {errorMsg}
            </span>
          ) : null}
          {/* update space */}
          <button
            className={`absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] py-2 rounded-md text-slate-500 
                      font-medium text-base shadow shadow-slate-500 hover:opacity-80 transition-all duration-300`}
            onClick={handleUpdateSpace}>
            Update
          </button>
        </div>
      ) : null}
    </Modal>
  );
};

export default UpdateSpace;
