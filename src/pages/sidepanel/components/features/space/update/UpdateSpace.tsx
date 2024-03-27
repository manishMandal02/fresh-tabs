import { useState, useEffect, useRef } from 'react';
import { useAtom } from 'jotai';

import { Tab } from '../tab';
import { wait } from '@root/src/utils';
import Spinner from '../../../elements/spinner';
import { useUpdateSpace } from './useUpdateSpace';
import { SlideModal } from '../../../elements/modal';
import ColorPicker from '../../../elements/color-picker';
import EmojiPicker from '../../../elements/emoji-picker';
import { showUpdateSpaceModalAtom } from '@root/src/stores/app';
import TextInput from '../../../elements/TextInput/TextInput';
import ErrorMessage from '../../../elements/alert-message/ErrorMessage';
import { ISpaceWithoutId, ITab } from '@root/src/pages/types/global.types';

const UpdateSpace = () => {
  console.log('UpdateSpace ~ 🔁 rendered');

  const [showModal, setShowModal] = useState(false);
  // update space modal global state/atom
  const [updateSpaceModal, setUpdateSpaceModal] = useAtom(showUpdateSpaceModalAtom);

  // update space data
  const [updateSpaceData, setUpdateSpaceData] = useState<ISpaceWithoutId | null>(null);

  const [tabs, setTabs] = useState<ITab[]>([]);

  // form ref
  const formRef = useRef<HTMLFormElement | null>(null);

  const handleCloseModal = () => {
    setShowModal(false);
    setUpdateSpaceModal(null);
    setUpdateSpaceData(undefined);
  };

  // logic hook
  const { handleUpdateSpace, errorMsg, setErrorMsg, snackbar } = useUpdateSpace({
    updateSpaceData,
    onClose: handleCloseModal,
    spaceId: updateSpaceModal?.id,
  });

  useEffect(() => {
    if (!updateSpaceModal?.id) return;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { tabs: tabsInSpace, id, ...space } = updateSpaceModal;

    setUpdateSpaceData(space);
    setErrorMsg('');
    setTabs(tabsInSpace);
    setShowModal(true);
    // focus title input after the form loads
    (async () => {
      await wait(10);
      (formRef.current?.firstElementChild as HTMLInputElement)?.focus();
    })();
    // focus form
  }, [updateSpaceModal, setErrorMsg]);

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

  return (
    <SlideModal title={`Update Space`} isOpen={showModal} onClose={handleCloseModal}>
      {showModal && updateSpaceData ? (
        <div className=" flex flex-col  w-full h-full py-2.5 px-4">
          <form className="mt-4 flex items-center gap-x-3" ref={formRef}>
            <TextInput placeholder="Enter space title..." value={updateSpaceData.title} onChange={onTitleChange} />
            <div className="w-[45px] h-[40px] bg-brand-darkBgAccent/50 hover:bg-brand-darkBgAccent/70 focus-within:bg-brand-darkBgAccent/90 focus-within:outline-brand-darkBgAccent">
              <EmojiPicker emoji={updateSpaceData.emoji} onChange={onEmojiChange} />
            </div>
            <ColorPicker color={updateSpaceData.theme} onChange={onThemeChange} />
          </form>
          {/* <hr
              tabIndex={-1}
              className="bg-brand-darkBgAccent/40 border-none mt-4 mb-2  h-[0.5px] w-[60%] mx-auto rounded-md"
            /> */}

          {/* numTabs */}
          <p className="text-slate-500 font-extralight mt-4 text-[14px] ml-px mb-px hover:bg-brand-darkBgAccent/70">
            {tabs.length} {tabs.length > 1 ? 'Tabs' : 'Tab'}
          </p>

          <div className="w-full h-fit max-h-[16rem] border-y border-brand-darkBgAccent/20 bg-red-30 overflow-x-hidden overflow-y-auto cc-scrollbar">
            {tabs.map(tab => (
              <Tab key={tab.id} tabData={tab} />
            ))}
          </div>

          {/* error msg */}
          <ErrorMessage msg={errorMsg} />

          {/* update space */}
          <button
            className={` mt-5 mx-auto w-[65%] py-2.5 rounded-md text-brand-darkBg/70 font-semibold text-[13px]
                    bg-brand-primary/90 hover:opacity-95 transition-all duration-200 border-none outline-none focus-within:outline-slate-600`}
            onClick={handleUpdateSpace}>
            {snackbar.isLoading ? <Spinner size="sm" /> : updateBtnLabel}
          </button>
        </div>
      ) : (
        <span>Space not found.</span>
      )}
    </SlideModal>
  );
};
export default UpdateSpace;
