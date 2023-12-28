import { MdOutlineSettings } from 'react-icons/md';
import { SlideModal } from '../elements/modal';
import { useState } from 'react';
import RadioGroup from '../elements/RadioGroup';
import { RadioOptions } from '../elements/RadioGroup/RadioGroup';
import Spinner from '../elements/spinner';
import { useAtom } from 'jotai';
import { snackbarAtom } from '@root/src/stores/app';

const shortcutOptions: RadioOptions[] = [
  { value: 'cmd+e', label: '<kbd>CMD</kbd> + <kbd>E</kbd>' },
  { value: 'cmd+shift+s', label: '<kbd>CMD</kbd> + <kbd>SHIFT</kbd> + <kbd>S</kbd>' },
];

const autoSaveOptions: RadioOptions[] = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const deleteUnsavedSpacesOptions: RadioOptions[] = [
  { value: 'immediately', label: 'Immediately' },
  { value: 'week', label: 'After a week' },
];

const Settings = () => {
  const [shortcutToOpen, setShortcutToOpen] = useState(shortcutOptions[0].value);
  const [autoSave, setAutoSave] = useState(autoSaveOptions[0].value);
  const [deleteUnsavedSpaces, setDeleteUnsavedSpaces] = useState(deleteUnsavedSpacesOptions[0].value);

  const [snackbar] = useAtom(snackbarAtom);

  const [isModalOpen, setIsModalOpen] = useState(true);
  // const [errorMsg, setErrorMsg] = useState('');

  const handleSaveSettings = async () => {};
  return (
    <>
      <MdOutlineSettings
        size={20}
        className="text-slate-600 mt-1 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      />
      <SlideModal title="Settings" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="relative flex flex-col  w-full h-[24rem] py-4 px-3.5 text-slate-400 ">
          {/* shortcuts */}
          <div className="mt-1">
            <span className="text-[15px]  font-light tracking-wide ">Shortcut to open FreshTabs</span>
            <RadioGroup
              options={shortcutOptions}
              value={shortcutToOpen}
              defaultValue={shortcutOptions[0].value}
              onChange={value => setShortcutToOpen(value)}
            />
          </div>
          <hr className="w-3/4 mx-auto h-px bg-slate-700/20 rounded-md border-none mt-4 mb-3" />
          {/* save & sync */}
          <div className="">
            <span className="text-[15px]  font-light tracking-wide ">Auto Save to Browser Bookmark</span>
            <RadioGroup
              options={autoSaveOptions}
              value={autoSave}
              defaultValue={autoSaveOptions[0].value}
              onChange={value => setAutoSave(value)}
            />
          </div>
          <hr className="w-3/4 mx-auto h-px bg-slate-700/20 rounded-md border-none mt-4 mb-3" />
          {/* save & sync */}
          <div className="">
            <span className="text-[15px]  font-light tracking-wide ">Delete Unsaved spaces after sessions</span>
            <RadioGroup
              options={deleteUnsavedSpacesOptions}
              value={deleteUnsavedSpaces}
              defaultValue={deleteUnsavedSpacesOptions[0].value}
              onChange={value => setDeleteUnsavedSpaces(value)}
            />
          </div>
          {/* save button */}
          <button
            className={` mt-12 mx-auto w-[90%] py-2 
                      rounded-md text-slate-500 font-medium text-base shadow shadow-slate-500 hover:opacity-80 transition-all duration-300`}
            onClick={handleSaveSettings}>
            {snackbar.isLoading ? <Spinner size="sm" /> : 'Save'}
          </button>
        </div>
      </SlideModal>
    </>
  );
};

export default Settings;
