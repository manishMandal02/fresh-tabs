import { useAtom, useSetAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { useHotkeys } from 'react-hotkeys-hook';

import { Tab } from '..';
import { ThemeColor } from '@root/src/constants/app';
import Spinner from '../../../../../../components/spinner';
import { ISpace, ITab } from '@root/src/types/global.types';
import { SlideModal } from '../../../../../../components/modal';
import ColorPicker from '../../../../../../components/color-picker';
import EmojiPicker from '../../../../../../components/emoji-picker';
import { getCurrentTab } from '@root/src/services/chrome-tabs/tabs';
import { setTabsForSpace } from '@root/src/services/chrome-storage/tabs';
import TextInput from '../../../../../../components/TextInput/TextInput';
import { createNewSpace } from '@root/src/services/chrome-storage/spaces';
import ErrorMessage from '../../../../../../components/alert-message/ErrorMessage';
import { snackbarAtom, showNewSpaceModalAtom, addSpaceAtom } from '@root/src/stores/app';

type DefaultSpaceFields = Pick<ISpace, 'title' | 'emoji' | 'theme'>;

const defaultSpaceData: DefaultSpaceFields = {
  title: '',
  emoji: '🚀',
  theme: ThemeColor.Fuchsia,
};

const CreateSpace = () => {
  console.log('CreateSpace ~ 🔁 rendered');

  const [currentTabs, setCurrentTabs] = useState<ITab[]>([]);
  const [errorMsg, setErrorMsg] = useState('Enter all the fields');

  // spaces atom (global state)
  const addSpace = useSetAtom(addSpaceAtom);

  // spaces atom (global state)
  const [newSpaceModal, setNewSpaceModal] = useAtom(showNewSpaceModalAtom);

  // new space data
  const [newSpaceData, setNewSpaceData] = useState<DefaultSpaceFields>(defaultSpaceData);

  // snackbar global state/atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  useEffect(() => {
    if (newSpaceModal.show && currentTabs?.length < 1) {
      (async () => {
        // get current tab, and set to state
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { index, ...currentTabOpened } = await getCurrentTab();

        if (!currentTabOpened) {
          setErrorMsg('Failed to get current tab, Please try again.');
          return;
        }

        setCurrentTabs([currentTabOpened]);
      })();
    }
  }, [newSpaceModal, currentTabs]);

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
    setNewSpaceData(defaultSpaceData);
    setErrorMsg('');
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

    if (newSpaceData.title.length > 20) {
      setErrorMsg('Space title should be less than 20 characters');
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

      addSpace(createdSpace);

      await setTabsForSpace(createdSpace.id, [...currentTabs]);

      setSnackbar({ show: true, msg: 'Space created', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to created space', isSuccess: false });
    }
  };

  useHotkeys(
    'shift+S',
    () => {
      setNewSpaceModal({ show: true, tabs: [] });

      //  remove letter s from tile that is trigged after new space shortcut (shift+s)
      setTimeout(() => {
        setNewSpaceData(prev => {
          if (prev.title) return { ...prev, title: '' };

          return prev;
        });
      }, 50);
    },
    [],
  );

  const handleCloseModal = () => {
    setNewSpaceModal({ show: false, tabs: [] });
    // add the
  };

  return (
    <SlideModal title="Add New Space" isOpen={newSpaceModal.show} onClose={handleCloseModal}>
      <div className=" flex flex-col  w-full h-full py-2.5 px-4">
        <div className="mt-4 flex items-center gap-x-3">
          <TextInput placeholder="Space Title..." value={newSpaceData.title} onChange={onTitleChange} />
          <div className="w-[45px] h-[40px] bg-brand-darkBgAccent/50 hover:bg-brand-darkBgAccent/70 focus-within:bg-brand-darkBgAccent/90 focus-within:outline-brand-darkBgAccent">
            <EmojiPicker emoji={newSpaceData.emoji} onChange={onEmojiChange} />
          </div>
          <ColorPicker color={newSpaceData.theme} onChange={onThemeChange} />
        </div>

        {/* tabs */}
        <div className="mt-6">
          <p className="text-slate-500 font text-sm mb-1.5">Tabs</p>
          {currentTabs?.map(tab => <Tab key={tab.id} tabData={tab} showHoverOption={false} />)}
        </div>

        {/* error msg */}
        <ErrorMessage msg={errorMsg} />

        {/* add space */}
        <button
          className={`mt-5 mx-auto w-[65%] py-2.5 rounded-md text-brand-darkBg/70 font-semibold text-[13px]
                      bg-brand-primary/90 hover:opacity-95 transition-all duration-200 border-none outline-none focus-within:outline-slate-600`}
          onClick={handleAddSpace}>
          {snackbar.isLoading ? <Spinner size="sm" /> : 'Add Space'}
        </button>
      </div>
    </SlideModal>
  );
};

export default CreateSpace;
