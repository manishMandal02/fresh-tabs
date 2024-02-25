import { getFaviconURL } from '@root/src/pages/utils/url';
import Tooltip from '../../../elements/tooltip';
import { MdAdd } from 'react-icons/md';
import { IPinnedTab } from '@root/src/pages/types/global.types';
import { KeyboardEventHandler, useState } from 'react';
import Popover from '../../../elements/popover';
import { saveGlobalPinnedTabs } from '@root/src/services/chrome-storage/tabs';

type Props = {
  tabs: IPinnedTab[];
  isGlobal: boolean;
  setGlobalPinnedTabs: (tabs: IPinnedTab[]) => void;
};

// pinned url limits for both global and space scope
const PinnedTabsLimit = 6;

const FavTab = ({ tabs, isGlobal, setGlobalPinnedTabs }: Props) => {
  const [showAddNewPopover, setShowAddNewPopover] = useState(false);

  const [newPinTab, setNewPinTab] = useState<IPinnedTab>({ url: '', title: '' });

  //  TODO - fix url format check, and only then enable add btn
  // add new pinned tabs
  const handleAddNewPin = async () => {
    if (!newPinTab.url) return;
    if (isGlobal) {
      await saveGlobalPinnedTabs([...tabs, newPinTab]);
      setGlobalPinnedTabs([...tabs, newPinTab]);
    }
  };

  const handleInputChange = (url: string, title: string) => {
    setNewPinTab({ url, title });
  };

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = ev => {
    if (ev.key.toLowerCase() !== 'escape') {
      ev.stopPropagation();
    }
  };

  const openPinnedTab = async (url: string) => {
    await chrome.tabs.create({ url, active: true });
  };

  // show an add url box if pinned tabs less then allowed limits
  const AddNewButton = (
    <div>
      <Popover
        open={showAddNewPopover}
        onChange={setShowAddNewPopover}
        content={
          <div className="h-[7rem] relative rounded-md px-3 py-2 bg-brand-darkBgAccent flex flex-col">
            <input
              type="text"
              placeholder="Title..."
              onKeyDown={handleKeydown}
              onChange={ev => {
                handleInputChange(newPinTab.url, ev.currentTarget.value);
              }}
              className="px-2 py-1 bg-brand-darkBg text-xs text-slate-300 outline-none border border-slate-800 rounded-md"
            />
            <input
              type="text"
              placeholder="Url..."
              onKeyDown={handleKeydown}
              onChange={ev => {
                handleInputChange(ev.currentTarget.value, newPinTab.title);
              }}
              className="px-2 mt-2 py-1 bg-brand-darkBg text-xs text-slate-300 outline-none border border-slate-800 rounded-md"
            />
            <button
              className="text-slate-50 border border-slate-800/80 bg-brand-darkBg  w-[70%] text-[10px] mx-auto py-1 rounded mt-3 disabled:cursor-default disabled:bg-slate-700"
              disabled={!newPinTab.url}
              onClick={handleAddNewPin}>
              Add
            </button>
          </div>
        }>
        <button
          className=" bg-gradient-to-bl from-brand-darkBgAccent to-brand-darkBg w-[26px] h-[24px] rounded-md flex items-center justify-center cursor-pointer focus:outline-slate-500 hover:bg-brand-darkBgAccent/80"
          onClick={handleAddNewPin}>
          <MdAdd className="text-base font-extralight text-slate-500" />
        </button>
      </Popover>
    </div>
  );

  return (
    <div className=" flex items-center justify-around w-[65%] mx-auto">
      {[...((tabs.length < PinnedTabsLimit ? [...tabs, { url: '' }] : [...tabs]) as IPinnedTab[])].map((tab, idx) =>
        tab?.url ? (
          <Tooltip key={tab.url} label={tab.title || tab.url} delay={1000}>
            <button
              className="bg-gradient-to-bl from-brand-darkBgAccent to-brand-darkBgAccent/70 z-10 cursor-pointer w-[26px] h-[24px] rounded-md flex items-center justify-center"
              onClick={() => openPinnedTab(tab.url)}>
              <img className="w-[14px] h-[14px] rounded-sm cursor-pointer" src={getFaviconURL(tab.url)} alt="icon" />
            </button>
          </Tooltip>
        ) : (
          <div key={tab?.url || '' + idx}>{AddNewButton}</div>
        ),
      )}
    </div>
  );
};

export default FavTab;
