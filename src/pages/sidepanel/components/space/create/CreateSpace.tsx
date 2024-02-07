import { ISpace, ITab, ThemeColor } from '@root/src/pages/types/global.types';
import ColorPicker from '../../elements/color-picker';
import EmojiPicker from '../../elements/emoji-picker';
import { SlideModal } from '../../elements/modal';
import { useState, useEffect, useCallback } from 'react';
import { Tab } from '..';
import { getCurrentTab } from '@root/src/services/chrome-tabs/tabs';
import { useAtom } from 'jotai';
import { snackbarAtom, nonActiveSpacesAtom, newSpaceModalAtom } from '@root/src/stores/app';
import { createNewSpace } from '@root/src/services/chrome-storage/spaces';
import Spinner from '../../elements/spinner';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import TextInput from '../../elements/TextInput/TextInput';

type DefaultSpaceFields = Pick<ISpace, 'title' | 'emoji' | 'theme'>;

const defaultSpaceData: DefaultSpaceFields = {
  title: 'Side projects',
  emoji: '🚀',
  theme: ThemeColor.Fuchsia,
};

const CreateSpace = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTabs, setCurrentTabs] = useState<ITab[]>([]);
  const [errorMsg, setErrorMsg] = useState('');

  // spaces atom (global state)
  const [, setSpaces] = useAtom(nonActiveSpacesAtom);

  // spaces atom (global state)
  const [newSpaceModal, setNewSpaceModal] = useAtom(newSpaceModalAtom);

  // new space data
  const [newSpaceData, setNewSpaceData] = useState<DefaultSpaceFields>(defaultSpaceData);

  // snackbar global state/atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  useEffect(() => {
    if (isModalOpen && currentTabs?.length < 1) {
      (async () => {
        // get current tab, and set to state
        const currentTabOpened = await getCurrentTab();

        if (!currentTabOpened) {
          setErrorMsg('Failed to get current tab, Please try again.');
          return;
        }

        setCurrentTabs([currentTabOpened]);
      })();
    }
  }, [isModalOpen, currentTabs]);

  // on title change
  const onTitleChange = (title: string) => {
    setNewSpaceData(prev => ({ ...prev, title }));
  };
  // on emoji change
  const onEmojiChange = (emoji: string) => {
    setNewSpaceData(prev => ({ ...prev, emoji }));
  };

  // on emoji change
  const onThemeChange = (theme: string) => {
    // eslint-disable-next-line
    // @ts-ignore
    setNewSpaceData(prev => ({ ...prev, theme }));
  };

  useEffect(() => {
    setIsModalOpen(newSpaceModal.show);
    if (newSpaceModal.tabs?.length > 0) {
      setCurrentTabs(newSpaceModal.tabs);
    }
  }, [newSpaceModal]);

  // create space
  const handleAddSpace = async () => {
    setErrorMsg('');
    if (!newSpaceData.emoji || !newSpaceData.title || !newSpaceData.theme || currentTabs?.length < 1) {
      setErrorMsg('Fill all the fields');
      return;
    }

    // show loading snackbar
    setSnackbar({ show: true, msg: 'Creating new space', isLoading: true });

    //  create space
    const createdSpace = await createNewSpace({ ...newSpaceData, isSaved: true, windowId: 0, activeTabIndex: 0 }, [
      ...currentTabs,
    ]);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // space created
    if (createdSpace?.id) {
      // close modal
      handleCloseModal();
      // re-render updated spaces
      setSpaces(prev => [...prev, { ...createdSpace }]);

      await setTabsForSpace(createdSpace.id, [...currentTabs]);

      setSnackbar({ show: true, msg: 'Space created', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to created space', isSuccess: false });
    }
  };

  const handleShortcut = useCallback(ev => {
    const keyEv = ev as KeyboardEvent;

    console.log('🚀 ~ handleShortcut ~ keyEv:', keyEv);

    if ((keyEv.ctrlKey || keyEv.shiftKey) && keyEv.key.toLowerCase() === 'a') {
      setIsModalOpen(true);
    }
  }, []);

  const handleCloseModal = () => {
    console.log('🚀 ~ CreateSpace.tsx ~ handleCloseModal: ✅');
    setIsModalOpen(false);
    setNewSpaceModal({ show: false, tabs: [] });
  };

  useEffect(() => {
    document.addEventListener('keydown', handleShortcut);

    return () => document.removeEventListener('keydown', handleShortcut);
  }, [handleShortcut]);

  return (
    <SlideModal
      title=""
      isOpen={isModalOpen}
      onClose={() => {
        console.log('settings modal onClose');

        handleCloseModal();
      }}>
      <div className=" flex flex-col  w-full h-full py-3 px-4">
        <div className="mt-4 flex items-center gap-x-3">
          <TextInput placeholder="Space Title..." value={newSpaceData.title} onChange={onTitleChange} />

          <EmojiPicker emoji={newSpaceData.emoji} onChange={onEmojiChange} />
          <ColorPicker color={newSpaceData.theme} onChange={onThemeChange} />
        </div>

        {/* tabs */}
        <div className="mt-6">
          <p className="text-slate-500 font text-sm mb-1.5">Tabs</p>
          {currentTabs?.map(tab => (
            <Tab key={tab.id} isModifierKeyPressed={false} isTabActive={false} tabData={tab} showHoverOption={false} />
          ))}
        </div>
        {/* error msg */}
        {errorMsg ? (
          <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
            {errorMsg}
          </span>
        ) : null}
        {/* add space */}
        <button
          className={` mt-6 mx-auto w-[70%] py-2 
                      rounded-md text-slate-700 font-semibold text-[13px] bg-brand-primary/90 hover:opacity-80 transition-all  duration-300`}
          onClick={handleAddSpace}>
          {snackbar.isLoading ? <Spinner size="sm" /> : 'Add Space'}
        </button>
      </div>
    </SlideModal>
  );
};

export default CreateSpace;
