import { useState, useEffect, ChangeEventHandler } from 'react';
import { AlertModal, SlideModal } from '../../modal';
import { ISpace } from '@root/src/pages/types/global.types';
import ColorPicker from '../../color-picker';
import EmojiPicker from '../../emoji-picker';

type Props = {
  space: ISpace;
  onClose: () => void;
};

const UpdateSpace = ({ space, onClose }: Props) => {
  // update space data
  const [updateSpaceData, setUpdateSpaceData] = useState<ISpace | undefined>(undefined);

  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(true);

  useEffect(() => {
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

  // handle delete
  const handleDeleteSpace = () => {
    //TODO - handle delete
  };

  return (
    <SlideModal title="Update Space" isOpen={!!updateSpaceData?.title} onClose={onClose}>
      {updateSpaceData?.title ? (
        <div className=" flex flex-col  w-full h-full py-3 px-4">
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
            <p className="text-slate-600 font-medium text-base">{updateSpaceData.tabs.length} tabs in space</p>
          </div>
          {/* error msg */}
          {errorMsg ? (
            <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
              {errorMsg}
            </span>
          ) : null}
          {/* update space */}
          <div className="absolute bottom-5 w-full flex flex-col items-center justify-center left-1/2 -translate-x-1/2">
            <button
              className={` w-[90%] py-2 rounded-md text-slate-500 
                      font-medium text-base shadow shadow-slate-500 hover:opacity-80 transition-all duration-300`}
              onClick={handleUpdateSpace}>
              Update
            </button>
            {/* delete space */}
            <button
              className={` w-[90%] py-1.5 rounded-md text-red-700 mt-4  text-base shadow shadow-red-800 hover:opacity-80 transition-all duration-300`}
              onClick={() => setShowDeleteModal(true)}>
              Remove
            </button>
          </div>
          {/* delete modal */}
          <AlertModal isOpen={showDeleteModal} title="Confirm Delete" onClose={() => setShowDeleteModal(false)}>
            <div className=" px-4 py-2.5 text-slate-400  ">
              <p className="font-light text-sm">Are you sure you want to delete this space?</p>

              <div className=" absolute bottom-4 right-3 ">
                <button
                  className="bg-slate-500 text-slate-100 w-20 py-2 mr-3 rounded-sm hover:opacity-90 transition-all duration-200"
                  onClick={() => setShowDeleteModal(false)}>
                  Cancel
                </button>
                <button
                  className="bg-red-600 text-slate-100 w-20 py-2 rounded-sm hover:opacity-90 transition-all duration-200"
                  onClick={handleDeleteSpace}>
                  Delete
                </button>
              </div>
            </div>
          </AlertModal>
        </div>
      ) : null}
    </SlideModal>
  );
};

export default UpdateSpace;
