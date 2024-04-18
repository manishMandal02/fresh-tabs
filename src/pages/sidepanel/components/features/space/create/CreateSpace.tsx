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

  const [tabs, setTabs] = useState<ITab[]>([]);
  const [errorMsg, setErrorMsg] = useState('Enter all the fields');

  // spaces atom (global state)
  const addSpace = useSetAtom(addSpaceAtom);

  // spaces atom (global state)
  const [newSpaceModal, setNewSpaceModal] = useAtom(showNewSpaceModalAtom);

  // new space data
  const [newSpaceData, setNewSpaceData] = useState<DefaultSpaceFields>(defaultSpaceData);

  // snackbar global state/atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

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

  // init component
  useEffect(() => {
    setNewSpaceData(defaultSpaceData);
    setErrorMsg('');

    if (newSpaceModal.tabs?.length > 0) {
      // use tabs passed to modal
      setTabs(newSpaceModal.tabs);
    } else {
      (async () => {
        // set the current tab

        // index is not required here ⬇️
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { index, ...currentTabOpened } = await getCurrentTab();
        setTabs([currentTabOpened]);
      })();
    }
  }, [newSpaceModal]);

  // create space
  const handleAddSpace = async () => {
    setErrorMsg('');
    if (!newSpaceData.emoji || !newSpaceData.title || !newSpaceData.theme || tabs?.length < 1) {
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
      ...tabs,
    ]);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // space created
    if (createdSpace?.id) {
      // close modal
      handleCloseModal();
      // re-render updated spaces

      addSpace(createdSpace);

      await setTabsForSpace(createdSpace.id, [...tabs]);

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
          <div
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            className="size-fit py-1.5 px-3 bg-brand-darkBgAccent/50 outline-none rounded-md hover:bg-brand-darkBgAccent/70 focus-within:bg-brand-darkBgAccent/90 focus-within:outline-brand-darkBgAccent">
            <EmojiPicker emoji={newSpaceData.emoji} onChange={onEmojiChange} />
          </div>
          <ColorPicker color={newSpaceData.theme} onChange={onThemeChange} />
        </div>

        {/* numTabs */}
        <p className="text-slate-500 font-extralight mt-5 text-[14px] ml-px mb-px ">
          {tabs.length} {tabs.length > 1 ? 'Tabs' : 'Tab'}
        </p>

        {/* tabs */}
        <div className="w-full h-fit max-h-[16rem] border-y border-brand-darkBgAccent/20 bg-red-30 overflow-x-hidden overflow-y-auto cc-scrollbar">
          {tabs.map(tab => (
            <Tab key={tab.id} tabData={tab} showDeleteOption={false} />
          ))}
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
