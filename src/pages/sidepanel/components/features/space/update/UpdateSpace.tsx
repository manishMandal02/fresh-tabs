import { useState, useEffect } from 'react';
import { SlideModal } from '../../../elements/modal';
import { ISpaceWithoutId, ITab } from '@root/src/pages/types/global.types';
import ColorPicker from '../../../elements/color-picker';
import EmojiPicker from '../../../elements/emoji-picker';
import Spinner from '../../../elements/spinner';
import { useUpdateSpace } from './useUpdateSpace';
import { useAtom } from 'jotai';
import { updateSpaceModalAtom } from '@root/src/stores/app';
import { createPortal } from 'react-dom';
import TextInput from '../../../elements/TextInput/TextInput';
import { Tab } from '../tab';

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
  const updateBtnLabel = (updateSpaceData?.isSaved && 'Update Space') || 'Save';

  return updateSpaceModal?.id && typeof updateSpaceData?.title === 'string'
    ? createPortal(
        <SlideModal title={`Update Space`} isOpen={typeof updateSpaceData?.title === 'string'} onClose={onClose}>
          <div className=" flex flex-col  w-full h-full py-3 px-4">
            <div className="mt-4 flex items-center gap-x-3">
              <TextInput placeholder="Enter space title..." value={updateSpaceData.title} onChange={onTitleChange} />

              <EmojiPicker emoji={updateSpaceData.emoji} onChange={onEmojiChange} />
              <ColorPicker color={updateSpaceData.theme} onChange={onThemeChange} />
            </div>
            {/* <hr
              tabIndex={-1}
              className="bg-brand-darkBgAccent/40 border-none mt-4 mb-2  h-[0.5px] w-[60%] mx-auto rounded-md"
            /> */}

            {/* numTabs */}
            <p className="text-slate-500 font-extralight mt-4 text-[14px] ml-px mb-px ">
              {tabs.length} {tabs.length > 1 ? 'Tabs' : 'Tab'}
            </p>

            <div className="w-full h-fit max-h-[16rem] border-y border-brand-darkBgAccent/20 bg-red-30 overflow-x-hidden overflow-y-auto cc-scrollbar">
              {tabs.map(tab => (
                <Tab key={tab.id} tabData={tab} isModifierKeyPressed={false} isTabActive={false} />
              ))}
            </div>

            {/* error msg */}
            {errorMsg ? (
              <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
                {errorMsg}
              </span>
            ) : null}
            {/* update space */}
            <button
              className={` mt-6 mx-auto w-[70%] py-2 rounded-md text-slate-700 font-semibold
                  text-[13px] bg-brand-primary/90 hover:opacity-80 transition-all  duration-300`}
              onClick={handleUpdateSpace}>
              {snackbar.isLoading ? <Spinner size="sm" /> : updateBtnLabel}
            </button>
          </div>
        </SlideModal>,
        document.body,
      )
    : null;
};

export default UpdateSpace;
