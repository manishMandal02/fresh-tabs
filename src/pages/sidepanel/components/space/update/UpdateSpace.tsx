import { useState, useEffect } from 'react';
import { SlideModal } from '../../elements/modal';
import { ISpaceWithoutId, ITab } from '@root/src/pages/types/global.types';
import ColorPicker from '../../elements/color-picker';
import EmojiPicker from '../../elements/emoji-picker';
import Spinner from '../../elements/spinner';
import { useUpdateSpace } from './useUpdateSpace';
import { useAtom } from 'jotai';
import { updateSpaceModalAtom } from '@root/src/stores/app';
import { createPortal } from 'react-dom';
import TextInput from '../../elements/TextInput/TextInput';

const UpdateSpace = () => {
  // update space modal global state/atom
  const [updateSpaceModal, setUpdateSpaceModal] = useAtom(updateSpaceModalAtom);

  // update space data
  const [updateSpaceData, setUpdateSpaceData] = useState<ISpaceWithoutId | undefined>(undefined);

  const [tabs, setTabs] = useState<ITab[]>([]);

  useEffect(() => {
    if (updateSpaceModal?.id) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { tabs, id, ...space } = updateSpaceModal;
      setUpdateSpaceData(space);
      setTabs(tabs);
    }
  }, [updateSpaceModal]);

  const onClose = () => {
    console.log('🚀 ~ onClose ~ setUpdateSpaceModal: 🔵');
    setUpdateSpaceModal(null);
    setUpdateSpaceData(undefined);
  };

  // logic hook
  const { handleUpdateSpace, errorMsg, snackbar } = useUpdateSpace({
    onClose,
    updateSpaceData,
    spaceId: updateSpaceModal?.id,
  });

  // on title change
  const onTitleChange = (title: string) => {
    setUpdateSpaceData(prev => ({ ...prev, title }));
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

  // set update button label
  const updateBtnLabel = (updateSpaceData?.isSaved && 'Update') || 'Save';

  return updateSpaceModal?.id && typeof updateSpaceData?.title === 'string'
    ? createPortal(
        <SlideModal
          isOpen={typeof updateSpaceData?.title === 'string'}
          onClose={() => {
            console.log('👋 On close called!!');
            onClose();
          }}>
          <div className=" flex flex-col  w-full h-full py-3 px-4">
            <div className="mt-4 flex items-center gap-x-3">
              <TextInput placeholder="Enter space title..." value={updateSpaceData.title} onChange={onTitleChange} />

              <EmojiPicker emoji={updateSpaceData.emoji} onChange={onEmojiChange} />
              <ColorPicker color={updateSpaceData.theme} onChange={onThemeChange} />
            </div>

            {/* numTabs */}
            <div className="mt-6 flex justify-between items-center">
              <p className="text-slate-500 font-light text-base">{tabs.length} tabs in space</p>
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
                className={` w-[65%] py-2  rounded-md text-slate-700  bg-brand-primary
                font-semibold text-sm hover:opacity-90 transition-all duration-300`}
                onClick={handleUpdateSpace}>
                {snackbar.isLoading ? <Spinner size="sm" /> : updateBtnLabel}
              </button>
            </div>
          </div>
        </SlideModal>,
        document.body,
      )
    : null;
};

export default UpdateSpace;
