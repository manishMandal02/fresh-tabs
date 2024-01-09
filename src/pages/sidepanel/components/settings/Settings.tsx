import { useState, useEffect } from 'react';
import RadioGroup, { RadioOptions } from '../elements/RadioGroup/RadioGroup';
import { useAtom } from 'jotai';
import { appSettingsAtom, snackbarAtom } from '@root/src/stores/app';
import { IAppSettings } from '@root/src/pages/types/global.types';
import { defaultAppSettings } from '@root/src/constants/app';
import { MdOpenInNew, MdOutlineSettings } from 'react-icons/md';
import { SlideModal } from '../elements/modal';
import Switch from '../elements/switch/Switch';
import Spinner from '../elements/spinner';
import { saveSettings } from '@root/src/services/chrome-storage/settings';

const shortcutOptions: RadioOptions[] = [
  { value: 'cmd+e', label: '<kbd>CMD</kbd> + <kbd>E</kbd>' },
  { value: 'cmd+shift+s', label: '<kbd>CMD</kbd> + <kbd>SHIFT</kbd> + <kbd>S</kbd>' },
];

const autoSaveToBookmark: RadioOptions[] = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

const deleteUnsavedSpacesOptions: RadioOptions[] = [
  { value: 'immediately', label: 'Immediately' },
  { value: 'week', label: 'After a week' },
];

const openSpaceOption: RadioOptions[] = [
  { value: 'newWindow', label: 'New Window' },
  { value: 'sameWindow', label: 'Same Window' },
];

type IAppSettingsKeys = keyof IAppSettings;

const Settings = () => {
  //
  const [isModalOpen, setIsModalOpen] = useState(true);

  // const [errorMsg, setErrorMsg] = useState('');

  // local settings state
  const [settingsUpdateData, setSettingsUpdateData] = useState<IAppSettings>(defaultAppSettings);

  const [openAppShortcut, setOpenAppShortcut] = useState('');

  // track settings changes from global state
  const [hasSettingsChanged, setHasSettingsChanged] = useState(false);

  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // settings global state
  const [appSettings, setAppSetting] = useAtom(appSettingsAtom);

  // set local settings data state
  useEffect(() => {
    setSettingsUpdateData(appSettings);
    getAppShortcut();
  }, [appSettings]);

  // on settings change
  const handleSettingsChange = (key: IAppSettingsKeys, value: IAppSettings[IAppSettingsKeys]) => {
    const updatedSettings = { ...settingsUpdateData, [key]: value };

    setSettingsUpdateData(updatedSettings);

    // check if settings has changed
    for (const key in updatedSettings) {
      if (appSettings[key] !== updatedSettings[key]) {
        setHasSettingsChanged(true);
      }
    }
  };

  const handleSaveSettings = async () => {
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Creating new space', isLoading: true });
    // set to chrome storage
    await saveSettings(settingsUpdateData);

    // set global state
    setAppSetting(settingsUpdateData);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // close modal
    setIsModalOpen(false);

    setSnackbar({ show: true, msg: 'Preferences saved', isSuccess: true });
  };

  const getAppShortcut = async () => {
    const chromeShortcuts = await chrome.commands.getAll();

    let openSidePanelShortcut = chromeShortcuts.find(s => s.name == '_execute_action')?.shortcut || '⌘E';

    openSidePanelShortcut = openSidePanelShortcut.split('').join(' + ');
    setOpenAppShortcut(openSidePanelShortcut);
  };

  const openChromeShortcutSettings = async () => {
    await chrome.tabs.create({ url: 'chrome://extensions/shortcuts', active: true });
  };

  return (
    <>
      <MdOutlineSettings
        size={20}
        className="text-slate-600 mt-1 cursor-pointer"
        onClick={() => setIsModalOpen(true)}
      />
      <SlideModal title="Preferences" isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="relative flex flex-col  w-full h-[32rem] py-4 px-3.5 text-slate-400 ">
          {/* shortcuts */}
          <div className="mt-1">
            <span className="text-[14px]  font-light tracking-wide ">Shortcut to open FreshTabs</span>
            <div className="flex items-center ">
              <RadioGroup
                options={[{ label: openAppShortcut, value: openAppShortcut }]}
                value={openAppShortcut}
                defaultValue={shortcutOptions[0].value}
                onChange={() => {}}
              />
              <button
                className="ml-2 flex items-center gap-x-1 border border-slate-700 rounded-sm px-2 py-1"
                onClick={openChromeShortcutSettings}>
                Change Shortcut In Chrome <MdOpenInNew />
              </button>
            </div>
          </div>
          <hr className="w-3/4 mx-auto h-px bg-slate-700/20 rounded-md border-none mt-4 mb-3" />
          {/* save & sync */}
          <div className="">
            <span className="text-[14px]  font-light tracking-wide ">Auto Save to Browser Bookmark</span>
            <RadioGroup
              options={autoSaveToBookmark}
              value={settingsUpdateData.autoSaveToBookmark}
              defaultValue={autoSaveToBookmark[0].value}
              onChange={value => handleSettingsChange('autoSaveToBookmark', value)}
            />
          </div>
          <hr className="w-3/4 mx-auto h-px bg-slate-700/20 rounded-md border-none mt-4 mb-3" />
          {/* save & sync */}
          <div className="">
            <span className="text-[14px]  font-light tracking-wide ">Delete Unsaved spaces after sessions</span>
            <RadioGroup
              options={deleteUnsavedSpacesOptions}
              value={settingsUpdateData.deleteUnsavedSpace}
              defaultValue={deleteUnsavedSpacesOptions[0].value}
              onChange={value => handleSettingsChange('deleteUnsavedSpace', value)}
            />
          </div>

          <hr className="w-3/4 mx-auto h-px bg-slate-700/20 rounded-md border-none mt-4 mb-3" />

          {/* open space in */}
          <div className="">
            <span className="text-[14px]  font-light tracking-wide ">Open space in</span>
            <RadioGroup
              options={openSpaceOption}
              value={settingsUpdateData.openSpace}
              defaultValue={openSpaceOption[0].value}
              onChange={value => handleSettingsChange('openSpace', value)}
            />
          </div>
          {/* active space expanded */}
          <div className="mt-3 flex items-center justify-between pr-2.5 border-b border-slate-700/30 rounded-sm py-1 pb-2.5">
            <label htmlFor="active-space-expanded" className="text-[14px] mr-8  font-light tracking-wide">
              Expand active space by default
            </label>
            <Switch
              id="active-space-expanded"
              checked={settingsUpdateData.activeSpaceExpanded}
              onChange={checked => handleSettingsChange('activeSpaceExpanded', checked)}
            />
          </div>
          {/* include bookmarks in search */}
          <div className="mt-3 flex items-center justify-between pr-2.5 border-b border-slate-700/30 rounded-sm  py-1 pb-2.5">
            <label htmlFor="include-bookmark-in-search" className="text-[14px] mr-12  font-light tracking-wide">
              Include Bookmarks in Search
            </label>
            <Switch
              id="include-bookmark-in-search"
              checked={settingsUpdateData.includeBookmarksInSearch}
              onChange={checked => handleSettingsChange('includeBookmarksInSearch', checked)}
            />
          </div>
          {/* save button */}
          <button
            className={` mt-8 mx-auto w-[90%] py-2  disabled:cursor-default
                      rounded-md text-slate-500 font-medium text-base shadow shadow-slate-500 hover:opacity-80 transition-all duration-300`}
            onClick={handleSaveSettings}
            disabled={!hasSettingsChanged}>
            {snackbar.isLoading ? <Spinner size="sm" /> : 'Save'}
          </button>
        </div>
      </SlideModal>
    </>
  );
};

export default Settings;
