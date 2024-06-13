import { useAtom } from 'jotai';
import { OpenInNewWindowIcon } from '@radix-ui/react-icons';
import { useState, useEffect, memo, ReactNode, FC } from 'react';

import Spinner from '../../../../../components/spinner';
import { IAppSettings } from '@root/src/types/global.types';
import Switch from '../../../../../components/switch/Switch';
import { SlideModal } from '../../../../../components/modal';
import { parseUrl, retryAtIntervals, wait } from '@root/src/utils';
import Accordion from '../../../../../components/accordion/Accordion';
import { AlarmName, DefaultAppSettings } from '@root/src/constants/app';
import { saveSettings } from '@root/src/services/chrome-storage/settings';
import { discardAllTabs } from '@root/src/services/chrome-discard/discard';
import { createAlarm, deleteAlarm } from '@root/src/services/chrome-alarms/helpers';
import RadioGroup, { RadioOptions } from '../../../../../components/radio-group/RadioGroup';
import { appSettingsAtom, showSettingsModalAtom, snackbarAtom } from '@root/src/stores/app';

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

const notesBubblePositionOptions: RadioOptions[] = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

type IAppSettingsKeys = keyof IAppSettings;

const Settings = () => {
  const [showSettingsModal, setShowSettingsModal] = useAtom(showSettingsModalAtom);

  // local settings state
  const [settingsUpdateData, setSettingsUpdateData] = useState<IAppSettings>(DefaultAppSettings);

  const [openAppShortcut, setOpenAppShortcut] = useState('');

  const [commandPaletteShortcut, setCommandPaletteShortcut] = useState('');

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
    for (const objKey in updatedSettings) {
      if (appSettings[objKey] !== updatedSettings[objKey]) {
        setHasSettingsChanged(true);
      }
    }
  };

  const handleSaveSettings = async () => {
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Creating new space', isLoading: true });
    // set to chrome storage
    await saveSettings(settingsUpdateData);

    // check if auto save to bookmark preference has changed
    if (settingsUpdateData.autoSaveToBookmark !== appSettings.autoSaveToBookmark) {
      // clear the previous trigger
      await deleteAlarm(AlarmName.autoSaveBM);
      // create new trigger ( 1d = 1440m)
      if (settingsUpdateData.autoSaveToBookmark === 'daily') {
        await createAlarm({ name: AlarmName.autoSaveBM, triggerAfter: 1440 });
      } else if (settingsUpdateData.autoSaveToBookmark == 'weekly') {
        await createAlarm({ name: AlarmName.autoSaveBM, triggerAfter: 1440 * 7 });
      }
    }

    // set global state
    setAppSetting(settingsUpdateData);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // close modal
    setShowSettingsModal(false);

    setSnackbar({ show: true, msg: 'Preferences saved', isSuccess: true });
  };

  const getAppShortcut = async () => {
    const chromeShortcuts = await chrome.commands.getAll();

    let openSidePanelShortcut = chromeShortcuts.find(s => s.name == '_execute_action')?.shortcut || '⌘E';

    let openCommandPaletteShortcut = chromeShortcuts.find(s => s.name == 'cmdPalette')?.shortcut || '⌘.';

    console.log('🚀 ~ getAppShortcut ~ openCommandPaletteShortcut:', openCommandPaletteShortcut);

    openSidePanelShortcut = openSidePanelShortcut.split('').join(' + ');
    openCommandPaletteShortcut = openCommandPaletteShortcut.split('').join(' + ');
    setOpenAppShortcut(openSidePanelShortcut);
    setCommandPaletteShortcut(openCommandPaletteShortcut);
  };

  const openChromeShortcutSettings = async () => {
    await chrome.tabs.create({ url: 'chrome://extensions/shortcuts', active: true });
  };

  const SettingsHeader: FC<{ heading: string }> = ({ heading }) => (
    <p className="text-[14px] text-slate-400 font-light my-1 ml-1">{heading}</p>
  );
  const BodyContainer: FC<{ children?: ReactNode }> = ({ children }) => <div className="py-2 px-2">{children}</div>;

  // activate tabs discarded via discarded url
  const handleResetDiscardedURL = async () => {
    const tabs = await chrome.tabs.query({ url: 'data:text/html,*' });

    const updateTabsBatch = tabs.map(t => chrome.tabs.update(t.id, { url: parseUrl(t.url) }));

    await Promise.allSettled(updateTabsBatch);

    // start discarding tabs as they're activated
    await wait(500);

    await discardAllTabs();

    await wait(750);

    // using retry mechanism to make sure the tabs are discarded at set intervals
    retryAtIntervals({
      retries: 5,
      interval: 1000,
      callback: async () => {
        const tabs = await chrome.tabs.query({ discarded: false, active: false, audible: false, status: 'complete' });

        // check if tabs are loading
        const loadingTabs = await chrome.tabs.query({ status: 'loading', active: false });

        if (tabs?.length < 1 && loadingTabs?.length < 1) return true;

        await discardAllTabs();

        return false;
      },
    });
  };

  return (
    <SlideModal title="Preferences" isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
      <div className="relative flex flex-col w-full h-fit max-h-[90vh] pt-2 pb-1 px-1.5 text-slate-400">
        {/* general */}
        <Accordion
          id="general"
          classes={{
            triggerContainer:
              'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px',
            triggerIcon: 'scale-[1.1] text-slate-700',
            content: 'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
          }}
          trigger={<SettingsHeader heading="General" />}>
          {/* accordion body */}
          <BodyContainer>
            {/* sidebar shortcut */}
            <p className="text-[12px] font-light tracking-wide ml-1">Shortcut to open FreshTabs side bar</p>
            <div className="flex items-center mt-[2.5px] mb-1.5">
              <RadioGroup
                options={[{ label: openAppShortcut, value: openAppShortcut }]}
                value={openAppShortcut}
                defaultValue={openAppShortcut}
                onChange={() => {}}
                disabled
              />
              <button
                className={`ml-2.5 flex items-center justify-between gap-x-1 px-2.5 py-1 text-slate-500 text-[10px] font-light rounded
                          bg-brand-darkBg border border-brand-darkBgAccent/40 shadow-sm shadow-brand-darkBg transition-colors duration-200 hover:text-slate-400/80`}
                onClick={openChromeShortcutSettings}>
                Change Shortcut In Chrome <OpenInNewWindowIcon className="text-slate-600/80" />
              </button>
            </div>
            {/* save & sync */}
            <p className="text-[12px]  font-light tracking-wide ml-1">Auto Save Spaces & Tabs to Bookmarks</p>
            <RadioGroup
              options={autoSaveToBookmark}
              value={settingsUpdateData.autoSaveToBookmark}
              defaultValue={autoSaveToBookmark[0].value}
              onChange={value => handleSettingsChange('autoSaveToBookmark', value)}
            />
            {/* save & sync */}
            <p className="text-[12px] mt-1.5  font-light tracking-wide ml-1">Delete Unsaved spaces after sessions</p>
            <RadioGroup
              options={deleteUnsavedSpacesOptions}
              value={settingsUpdateData.deleteUnsavedSpace}
              defaultValue={deleteUnsavedSpacesOptions[0].value}
              onChange={value => handleSettingsChange('deleteUnsavedSpace', value)}
            />

            {/* open space in */}
            <div className="mt-2.5">
              <span className="text-[12px]  font-light tracking-wide ml-1 ">Open space in</span>
              <RadioGroup
                options={openSpaceOption}
                value={settingsUpdateData.openSpace}
                defaultValue={openSpaceOption[0].value}
                onChange={value => handleSettingsChange('openSpace', value)}
              />
            </div>
          </BodyContainer>
        </Accordion>

        {/* command palette */}
        <Accordion
          id="command-palette"
          classes={{
            triggerContainer:
              'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px',
            triggerIcon: 'scale-[1.1] text-slate-700',
            content: 'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
          }}
          trigger={<SettingsHeader heading="Command Palette" />}>
          {/* accordion body */}
          <BodyContainer>
            <p className="text-[12px] font-light tracking-wide ml-1">Shortcut to open command palette</p>
            <div className="flex items-center mt-[2.5px] mb-1.5">
              <RadioGroup
                options={[{ label: commandPaletteShortcut, value: commandPaletteShortcut }]}
                value={commandPaletteShortcut}
                defaultValue={commandPaletteShortcut}
                onChange={() => {}}
                disabled
              />
              <button
                className={`ml-2.5 flex items-center justify-between gap-x-1 px-2.5 py-1 text-slate-500 text-[10px] font-light rounded
                          bg-brand-darkBg border border-brand-darkBgAccent/40 shadow-sm shadow-brand-darkBg transition-colors duration-200 hover:text-slate-400/80`}
                onClick={openChromeShortcutSettings}>
                Change Shortcut In Chrome <OpenInNewWindowIcon className="text-slate-600/80" />
              </button>
            </div>
            {/* include bookmarks in search */}
            <div className="flex items-center justify-between px-1">
              <p className="text-[12px]  font-light tracking-wide ml-1">Include Bookmarks in Search</p>
              <Switch
                size="medium"
                id="include-bookmark-in-search"
                checked={settingsUpdateData.includeBookmarksInSearch}
                onChange={checked => handleSettingsChange('includeBookmarksInSearch', checked)}
              />
            </div>
          </BodyContainer>
        </Accordion>

        {/* notes */}
        <Accordion
          id="notes"
          classes={{
            triggerContainer:
              'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px',
            triggerIcon: 'scale-[1.1] text-slate-700',
            content: 'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
          }}
          trigger={<SettingsHeader heading="Notes" />}>
          {/* accordion body */}
          <BodyContainer>
            {/* notes position */}
            <p className="text-[12px]  font-light tracking-wide ml-1">Notes bubble position on sites</p>
            <RadioGroup
              options={notesBubblePositionOptions}
              value={settingsUpdateData.notesBubblePos}
              defaultValue={notesBubblePositionOptions[1].value}
              onChange={value => handleSettingsChange('notesBubblePos', value)}
            />
            <div className="flex items-center justify-between px-1 mt-1.5">
              <p className="text-[12px]  font-light tracking-wide ml-1">{'Show notes bubble for all sites'}</p>
              <Switch
                size="medium"
                id="include-bookmark-in-search"
                checked={settingsUpdateData.showNotesBubbleForAllSites}
                onChange={checked => handleSettingsChange('showNotesBubbleForAllSites', checked)}
              />
            </div>
          </BodyContainer>
        </Accordion>

        {/* reset discarded tab urls */}
        <Accordion
          id="reset-discarded-tabs"
          defaultCollapsed
          classes={{
            triggerContainer:
              'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px',
            triggerIcon: 'scale-[1.1] text-slate-700',
            content: 'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md',
          }}
          trigger={<SettingsHeader heading="Reset discarded tab URLs" />}>
          {/* accordion body */}
          <BodyContainer>
            {/* include bookmarks in search */}
            <div className="flex items-center justify-between px-2">
              <p className="text-[12px]  font-light tracking-wide ml-1">
                Reset discarded tabs url and <br /> discard them natively
              </p>
              <button
                onClick={handleResetDiscardedURL}
                className="text-slate-400 bg-brand-darkBgAccent/80 px-4 py-1 rounded-md hover:opacity-90 transition-opacity duration-200">
                Reset
              </button>
            </div>
          </BodyContainer>
        </Accordion>

        {/* save button */}
        <button
          className={`mt-4 mx-auto w-[60%] py-2.5 border border-brand-darkBgAccent/70 tex-[15px] text-slate-700 font-semibold hover:opacity-90 transition-all duration-300 
                      rounded-md bg-brand-primary/90 disabled:cursor-default disabled:bg-transparent disabled:text-slate-500 `}
          onClick={handleSaveSettings}
          disabled={!hasSettingsChanged}>
          {snackbar.isLoading ? <Spinner size="sm" /> : 'Save'}
        </button>
      </div>
    </SlideModal>
  );
};

export default memo(Settings);
