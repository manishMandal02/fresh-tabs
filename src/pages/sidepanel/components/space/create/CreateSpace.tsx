import { ISpace, ITab } from '@root/src/pages/types/global.types';
import ColorPicker from '../../color-picker';
import EmojiPicker from '../../emoji-picker';
import { SlideModal } from '../../modal';
import { useState, useEffect, ChangeEventHandler } from 'react';
import { Tab } from '..';
import Tooltip from '../../tooltip';
import { testSpaces } from '../../../testData';

const defaultSpaceData = testSpaces[2];

const CreateSpace = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<null | ITab>(null);
  const [errorMsg, setErrorMsg] = useState('');

  // new space data

  const [newSpaceData, setNewSpaceData] = useState<ISpace>(defaultSpaceData);

  useEffect(() => {
    //TODO - get current tab, and set to state
    setCurrentTab({
      url: 'https://www.w3schools.com/howto/howto_html_favicon.asp',
      faviconURI: 'https://www.w3schools.com/favicon.ico',
      title: '',
    });
  }, []);

  // on title change
  const onTitleChange: ChangeEventHandler<HTMLInputElement> = ev => {
    setNewSpaceData(prev => ({ ...prev, title: ev.target.value }));
  };
  // on emoji change
  const onEmojiChange = (emoji: string) => {
    setNewSpaceData(prev => ({ ...prev, emoji }));
  };

  // handle create space
  const handleCreateSpace = () => {
    setIsModalOpen(true);
  };

  // create space
  const handleAddSpace = () => {
    setErrorMsg('');
    if (!newSpaceData.emoji || !newSpaceData.title || !newSpaceData.theme || newSpaceData.tabs.length < 1) {
      setErrorMsg('Fill all the fields');
      return;
    }
    // TODO - create space
  };

  return (
    <>
      <Tooltip label="Add new space">
        <button
          className={`w-full border border-slate-700 text-xl font-light  text-slate-700 
        flex items-center justify-center rounded-md py-1.5 hover:border-slate-700/80 hover:text-slate-700/80 transition-all duration-200`}
          onClick={handleCreateSpace}>
          +
        </button>
      </Tooltip>
      {/* modal */}
      <SlideModal title="New Space" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="relative flex flex-col  w-full h-full py-3 px-4">
          <div className="mt-4 flex items-center gap-x-3">
            <input
              type="text"
              className="rounded bg-slate-700  px-2.5 py-1.5 text-[1rem] text-slate-200 w-48 outline-slate-600"
              placeholder="Space Title..."
              value={newSpaceData.title}
              onChange={onTitleChange}
            />
            <EmojiPicker emoji={newSpaceData.emoji} onChange={onEmojiChange} />
            <ColorPicker color={newSpaceData.theme} onChange={() => {}} />
          </div>

          {/* tabs */}
          <div className="mt-6">
            <p className="text-slate-500 font text-sm mb-1.5">Tabs</p>
            <>{currentTab ? <Tab tabData={currentTab} showHoverOption={false} /> : null}</>
          </div>
          {/* error msg */}
          {errorMsg ? (
            <span className="test-base mx-auto mt-6 text-slate-700 font-medium bg-red-400 px-3 py-1 w-fit text-center rounded-sm">
              {errorMsg}
            </span>
          ) : null}
          {/* add space */}
          <button
            className="absolute bottom-5 left-1/2 -translate-x-1/2 w-[90%] py-2 rounded-md text-slate-500 font-medium text-base shadow shadow-slate-500 hover:opacity-80 transition-all duration-300"
            onClick={handleAddSpace}>
            Add
          </button>
        </div>
      </SlideModal>
    </>
  );
};

export default CreateSpace;
