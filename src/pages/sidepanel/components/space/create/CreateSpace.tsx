import { ISpace, ITab, ThemeColor } from '@root/src/pages/types/global.types';
import ColorPicker from '../../elements/color-picker';
import { MdAdd } from 'react-icons/md';
import EmojiPicker from '../../elements/emoji-picker';
import { SlideModal } from '../../elements/modal';
import { useState, useEffect, ChangeEventHandler } from 'react';
import { Tab } from '..';
import Tooltip from '../../elements/tooltip';
import { getCurrentTab } from '@root/src/services/chrome-tabs/tabs';
import { useAtom } from 'jotai';
import { snackbarAtom, spacesAtom } from '@root/src/stores/app';
import { createNewSpace } from '@root/src/services/chrome-storage/spaces';
import Spinner from '../../elements/spinner';

type DefaultSpaceFields = Pick<ISpace, 'title' | 'emoji' | 'theme'>;

const defaultSpaceData: DefaultSpaceFields = {
  title: 'Side projects',
  emoji: '🚀',
  theme: ThemeColor.Fuchsia,
};

const CreateSpace = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<null | ITab>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // spaces atom (global state)
  const [, setSpaces] = useAtom(spacesAtom);

  // new space data
  const [newSpaceData, setNewSpaceData] = useState<DefaultSpaceFields>(defaultSpaceData);

  // snackbar global state/atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  useEffect(() => {
    if (isModalOpen) {
      (async () => {
        // get current tab, and set to state
        const currentTabOpened = await getCurrentTab();

        if (!currentTabOpened) {
          setErrorMsg('Failed to get current tab, Please try again.');
          return;
        }

        setCurrentTab(currentTabOpened);
      })();
    }
  }, [isModalOpen]);

  // on title change
  const onTitleChange: ChangeEventHandler<HTMLInputElement> = ev => {
    setNewSpaceData(prev => ({ ...prev, title: ev.target.value }));
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

  // handle create space
  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  // create space
  const handleAddSpace = async () => {
    setErrorMsg('');
    if (!newSpaceData.emoji || !newSpaceData.title || !newSpaceData.theme || !currentTab.url) {
      setErrorMsg('Fill all the fields');
      return;
    }

    // TODO - check the title ## should not be include
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Creating new space', isLoading: true });

    //  create space
    const createdSpace = await createNewSpace({ ...newSpaceData, isSaved: true, windowId: 0, activeTabIndex: 0 }, [
      currentTab,
    ]);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // space created
    if (createdSpace?.id) {
      // close modal
      setIsModalOpen(false);

      // re-render updated spaces
      setSpaces(prev => [...prev, { ...createdSpace, tabs: [currentTab] }]);

      setSnackbar({ show: true, msg: 'Space created', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to created space', isSuccess: false });
    }
  };

  return (
    <>
      <button
        className={`border border-slate-600/80 shadow-sm shadow-slate-800 text-2xl  bg-slate-800 text-slate-500/90 fixed bottom-5 right-5 
        flex items-center justify-center rounded-full w-12 h-12  hover:text-slate-500/60 transition-all duration-200`}
        onClick={handleOpenModal}>
        <Tooltip label="Add new space">
          <MdAdd className="w-full h-full opacity-80 " />
        </Tooltip>
      </button>
      {/* modal */}
      <SlideModal title="New Space" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className=" flex flex-col  w-full h-full py-3 px-4">
          <div className="mt-4 flex items-center gap-x-3">
            <input
              type="text"
              className="rounded bg-slate-700  px-2.5 py-1.5 text-[1rem] text-slate-200 w-48 outline-slate-600"
              placeholder="Space Title..."
              value={newSpaceData.title}
              onChange={onTitleChange}
            />
            <EmojiPicker emoji={newSpaceData.emoji} onChange={onEmojiChange} />
            <ColorPicker color={newSpaceData.theme} onChange={onThemeChange} />
          </div>

          {/* tabs */}
          <div className="mt-6">
            <p className="text-slate-500 font text-sm mb-1.5">Tabs</p>
            {currentTab ? <Tab isTabActive={false} tabData={currentTab} showHoverOption={false} /> : null}
          </div>
          {/* error msg */}
          {errorMsg ? (
            <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
              {errorMsg}
            </span>
          ) : null}
          {/* add space */}
          <button
            className={` mt-16 mx-auto w-[90%] py-2 
                      rounded-md text-slate-500 font-medium text-base shadow shadow-slate-500 hover:opacity-80 transition-all duration-300`}
            onClick={handleAddSpace}>
            {snackbar.isLoading ? <Spinner size="sm" /> : 'Add'}
          </button>
        </div>
      </SlideModal>
    </>
  );
};

export default CreateSpace;
