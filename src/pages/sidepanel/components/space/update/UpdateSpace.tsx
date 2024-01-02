import { useState, useEffect, ChangeEventHandler } from 'react';
import { AlertModal, SlideModal } from '../../elements/modal';
import { ISpace, ITab } from '@root/src/pages/types/global.types';
import ColorPicker from '../../elements/color-picker';
import EmojiPicker from '../../elements/emoji-picker';
import Spinner from '../../elements/spinner';
import { useUpdateSpace } from './useUpdateSpace';
import { MdOutlineSync } from 'react-icons/md';

type Props = {
  space: ISpace;
  tabs: ITab[];
  isActive: boolean;
  onClose: () => void;
};

const UpdateSpace = ({ space, tabs, onClose, isActive }: Props) => {
  // update space data
  const [updateSpaceData, setUpdateSpaceData] = useState<ISpace | undefined>(undefined);

  // logic hook
  const {
    handleUpdateSpace,
    handleDeleteSpace,
    handleSyncTabs,
    errorMsg,
    snackbar,
    showDeleteModal,
    setShowDeleteModal,
  } = useUpdateSpace({
    updateSpaceData,
    onClose,
    space,
    tabs,
  });

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

  // on emoji change
  const onThemeChange = (theme: string) => {
    //eslint-disable-next-line
    //@ts-ignore
    setUpdateSpaceData(prev => ({ ...prev, theme }));
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
            <ColorPicker color={updateSpaceData.theme} onChange={onThemeChange} />
          </div>

          {/* tabs */}
          <div className="mt-6 flex justify-between items-center">
            <p className="text-slate-500 font-light text-base">{tabs?.length} tabs in space</p>
            {/* sync tabs */}
            {isActive ? (
              <button
                className="bg-teal-400 flex items-center text-slate-800 font-medium text-xs rounded-sm px-2 py-1.5 transition-all duration-300 hover:bg-opacity-90"
                onClick={handleSyncTabs}>
                <MdOutlineSync size={16} className="mr-1" /> Sync Tabs
              </button>
            ) : null}
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
                      font-medium text-base shadow shadow-emerald-400 hover:opacity-80 transition-all duration-300`}
              onClick={handleUpdateSpace}>
              {snackbar.isLoading ? <Spinner size="sm" /> : updateSpaceData.isSaved ? 'Update' : 'Save'}
            </button>
            {/* delete space */}
            <button
              className={` w-[90%] py-1.5 rounded-md text-slate-500 mt-4   font-medium text-base shadow shadow-rose-600 hover:opacity-80 transition-all duration-300`}
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
                  {snackbar.isLoading ? <Spinner size="sm" /> : 'Delete'}
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
