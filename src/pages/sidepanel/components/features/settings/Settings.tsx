import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import Select from 'react-select';
import { Cross2Icon, OpenInNewWindowIcon } from '@radix-ui/react-icons';
import { useState, useEffect, memo, ReactNode, FC, useRef } from 'react';

import Spinner from '../../../../../components/spinner';
import { IAppSettings } from '@root/src/types/global.types';
import { SlideModal } from '../../../../../components/modal';
import Switch from '../../../../../components/switch/Switch';
import Accordion from '../../../../../components/accordion/Accordion';
import { useCustomAnimation } from '../../../hooks/useCustomAnimation';
import { saveSettings } from '@root/src/services/chrome-storage/settings';
import { discardAllTabs } from '@root/src/services/chrome-discard/discard';
import { createAlarm, deleteAlarm } from '@root/src/services/chrome-alarms/helpers';
import { AlarmName, CommandType, DefaultAppSettings } from '@root/src/constants/app';
import RadioGroup, { RadioOptions } from '../../../../../components/radio-group/RadioGroup';
import { appSettingsAtom, showSettingsModalAtom, snackbarAtom } from '@root/src/stores/app';
import { removeWWWPrefix, cn, getUrlDomain, parseUrl, retryAtIntervals, wait, isValidURL } from '@root/src/utils';

export const DomainWithSubdomainRegex = /^(?:[-A-Za-z0-9]+\.)+[A-Za-z]{2,10}$/;

const autoSaveToBookmark: RadioOptions[] = [
  { value: 'off', label: 'Off' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];
const openLinkPreviewOptions: RadioOptions[] = [
  { value: 'all-external', label: 'External Links' },
  { value: 'shift-click', label: 'Shift + Click' },
];
const linkPreviewSizeOptions: RadioOptions[] = [
  { value: 'mobile', label: 'Mobile' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'desktop', label: 'Desktop' },
];

const deleteUnsavedSpacesOptions: RadioOptions[] = [
  { value: 'immediately', label: 'Immediately' },
  { value: 'week', label: 'After a week' },
];

const openSpaceOptions: RadioOptions[] = [
  { value: 'newWindow', label: 'New Window' },
  { value: 'sameWindow', label: 'Same Window' },
];

const notesBubblePositionOptions: RadioOptions[] = [
  { value: 'bottom-left', label: 'Bottom Left' },
  { value: 'bottom-right', label: 'Bottom Right' },
];

const autoDiscardIntervalTimeOptions: RadioOptions[] = [
  { value: '5', label: '5 min' },
  { value: '10', label: '10 min' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
];

const CommandsNotAllowedToDisable: CommandType[] = [
  'switch-space',
  'new-space',
  'new-note',
  'link',
  'snooze-tab',
  'discard-tabs',
  'switch-tab',
];

// maps current enabled/active cmd to show select option to disable them
const getCommandsToDisableSelectOptions = (disabledCmd: CommandType[]): RadioOptions[] => {
  let allCommands = Object.values(CommandType);

  allCommands = allCommands.filter(cmd => !CommandsNotAllowedToDisable.includes(cmd));

  if (disabledCmd.length > 0) {
    allCommands = allCommands.filter(cmd => !disabledCmd.includes(cmd));
  }

  return allCommands.map(cmd => {
    return {
      value: cmd,
      label: cmd.replaceAll('-', ' '),
    };
  });
};

type IAppSettingsKeys = keyof IAppSettings;

const Settings = () => {
  console.log('Settings 🔁 rendered');
  const [showSettingsModal, setShowSettingsModal] = useAtom(showSettingsModalAtom);

  // local settings state
  const [settingsUpdateData, setSettingsUpdateData] = useState<IAppSettings>(DefaultAppSettings);

  const [openAppShortcut, setOpenAppShortcut] = useState('');

  const whitelistInputRef = useRef<HTMLInputElement>(null);

  const [enabledCmdOptions, setEnabledCmdOptions] = useState([]);

  const [commandPaletteShortcut, setCommandPaletteShortcut] = useState('');

  // track settings changes from global state
  const [hasSettingsChanged, setHasSettingsChanged] = useState(false);

  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // settings global state
  const [appSettings, setAppSetting] = useAtom(appSettingsAtom);

  // set local settings data state
  useEffect(() => {
    if (!showSettingsModal) return;
    setSettingsUpdateData(appSettings);
    getAppShortcuts();
    const enabledCommands = getCommandsToDisableSelectOptions(appSettings.cmdPalette.disabledCommands);

    setEnabledCmdOptions(enabledCommands);
  }, [showSettingsModal]);

  // on settings change
  const handleSettingsChange = (key: IAppSettingsKeys, value: IAppSettings[IAppSettingsKeys]) => {
    const updatedSettings = { ...settingsUpdateData, [key]: value };

    // disable sub features if main feat is turned off

    if (key === 'cmdPalette' && updatedSettings.cmdPalette.isDisabled !== settingsUpdateData.cmdPalette.isDisabled) {
      updatedSettings.cmdPalette.includeBookmarksInSearch = !updatedSettings.cmdPalette.isDisabled;
      updatedSettings.cmdPalette.includeNotesInSearch = !updatedSettings.cmdPalette.isDisabled;
    }

    if (key === 'notes' && updatedSettings.notes.isDisabled !== settingsUpdateData.notes.isDisabled) {
      updatedSettings.notes.showOnAllSites = !updatedSettings.notes.isDisabled;
    }

    setSettingsUpdateData(updatedSettings);

    // check if settings has changed
    let hasChanged = false;
    // compare setting properties
    for (const objKey in updatedSettings) {
      if (appSettings[objKey] === updatedSettings[objKey]) continue;
      // settings changed, break loop
      hasChanged = true;
      break;
    }
    setHasSettingsChanged(hasChanged);
  };

  const handleSaveSettings = async () => {
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

    //  update auto discard tabs alarm if preference has been changed
    if (settingsUpdateData.autoDiscardTabs.isEnabled !== appSettings.autoDiscardTabs.isEnabled) {
      // clear the previous trigger
      await deleteAlarm(AlarmName.autoDiscardTabs);
      // create new trigger ( 1d = 1440m)
      if (settingsUpdateData.autoDiscardTabs.isEnabled) {
        await createAlarm({
          isRecurring: true,
          name: AlarmName.autoDiscardTabs,
          triggerAfter: 5 * 60 * 1000, // 5 minutes
        });
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

  // update blocked commands
  const handleUpdateBlockCommands = async (commands: CommandType[]) => {
    const updatedSettings = {
      ...settingsUpdateData,
      cmdPalette: { ...settingsUpdateData.cmdPalette, disabledCommands: commands },
    };
    await saveSettings(updatedSettings);

    // save to global (ui) state
    setAppSetting(updatedSettings);
  };

  // save whitelist site
  const handleAddWhitelistDomain = async () => {
    let domainInput = whitelistInputRef.current.value;

    if (!domainInput) return;

    if (!DomainWithSubdomainRegex.test(domainInput) && !isValidURL(domainInput)) {
      whitelistInputRef.current.setAttribute('data-invalid-domain', 'true');
      return;
    }

    if (!DomainWithSubdomainRegex.test(domainInput)) {
      domainInput = getUrlDomain(domainInput);
    }

    domainInput = removeWWWPrefix(domainInput);

    const updatedSettings = {
      ...appSettings,
      autoDiscardTabs: {
        ...appSettings.autoDiscardTabs,
        whitelistedDomains: [...appSettings.autoDiscardTabs.whitelistedDomains, domainInput],
      },
    };
    // save to storage
    await saveSettings(updatedSettings);

    setSettingsUpdateData(updatedSettings);

    whitelistInputRef.current.value = '';

    // save to global (ui) state
    setAppSetting(updatedSettings);
  };

  // remove whitelist site
  const handleRemoveWhitelistDomain = async (domain: string) => {
    const updatedSettings = {
      ...appSettings,
      autoDiscardTabs: {
        ...appSettings.autoDiscardTabs,
        whitelistedDomains: appSettings.autoDiscardTabs.whitelistedDomains.filter(d => d !== domain),
      },
    };

    // save to storage
    await saveSettings(updatedSettings);

    setSettingsUpdateData(updatedSettings);

    // save to global (ui) state
    setAppSetting(updatedSettings);
  };

  const getAppShortcuts = async () => {
    const chromeShortcuts = await chrome.commands.getAll();

    let openSidePanelShortcut = chromeShortcuts.find(s => s.name == '_execute_action')?.shortcut || '⌘E';

    let openCommandPaletteShortcut = chromeShortcuts.find(s => s.name == 'cmdPalette')?.shortcut || '⌘.';

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

  const { bounce } = useCustomAnimation();

  return (
    <SlideModal title="Preferences" isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)}>
      <div
        id="preference-container"
        className="relative flex flex-col w-full h-full max-h-[90vh] pt-1.5 px-1 text-slate-400">
        <div className="w-full h-fit max-h-[100%] overflow-y-auto cc-scrollbar pb-[28.5px]">
          {/* general */}
          <Accordion
            id="general"
            classes={{
              triggerContainer:
                'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px mb-[3px]',
              triggerIcon: 'scale-[1.1] text-slate-700',
              content:
                'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
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
                          bg-brand-darkBg border border-brand-darkBgAccent/40 transition-colors duration-200 hover:text-slate-400/80`}
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
              <p className="text-[12px] mt-1.5 font-light tracking-wide ml-1">Delete Unsaved spaces after sessions</p>
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
                  options={openSpaceOptions}
                  value={settingsUpdateData.openSpace}
                  defaultValue={openSpaceOptions[0].value}
                  onChange={value => handleSettingsChange('openSpace', value)}
                />
              </div>
            </BodyContainer>
          </Accordion>

          {/* link preview */}
          <Accordion
            id="link-preview"
            defaultCollapsed
            classes={{
              triggerContainer:
                'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px mb-[3px]',
              triggerIcon: 'scale-[1.1] text-slate-700',
              content:
                'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
            }}
            trigger={<SettingsHeader heading="Link Preview" />}>
            {/* accordion body */}
            <BodyContainer>
              {/* disable command palette */}
              <div className="flex items-center justify-between pr-1 mb-2">
                <p className="text-[12px]  font-light tracking-wide ml-1">Disable Link preview</p>
                <Switch
                  size="medium"
                  id="disable-link-preview"
                  checked={settingsUpdateData.linkPreview.isDisabled}
                  onChange={checked =>
                    handleSettingsChange('linkPreview', { ...settingsUpdateData.linkPreview, isDisabled: checked })
                  }
                />
              </div>

              <div className="mt-2.5">
                <span className="text-[12px]  font-light tracking-wide ml-1 ">Open link preview for?</span>
                <RadioGroup
                  options={openLinkPreviewOptions}
                  value={settingsUpdateData.linkPreview.openTrigger}
                  defaultValue={openLinkPreviewOptions[0].value}
                  onChange={value =>
                    handleSettingsChange('linkPreview', { ...settingsUpdateData.linkPreview, openTrigger: value })
                  }
                />
              </div>

              <div className="mt-2.5">
                <span className="text-[12px]  font-light tracking-wide ml-1 ">Link preview window size</span>
                <RadioGroup
                  options={linkPreviewSizeOptions}
                  value={settingsUpdateData.linkPreview.size}
                  defaultValue={linkPreviewSizeOptions[0].value}
                  onChange={value =>
                    handleSettingsChange('linkPreview', { ...settingsUpdateData.linkPreview, size: value })
                  }
                />
              </div>
            </BodyContainer>
          </Accordion>

          {/* command palette */}
          <Accordion
            id="command-palette"
            defaultCollapsed
            classes={{
              triggerContainer:
                'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px mb-[3px]',
              triggerIcon: 'scale-[1.1] text-slate-700',
              content:
                'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
            }}
            trigger={<SettingsHeader heading="Command Palette" />}>
            {/* accordion body */}
            <BodyContainer>
              {/* disable command palette */}
              <div className="flex items-center justify-between pr-1 mb-2">
                <p className="text-[12px]  font-light tracking-wide ml-1">Disable Command Palette</p>
                <Switch
                  size="medium"
                  id="include-bookmark-in-search"
                  checked={settingsUpdateData.cmdPalette.isDisabled}
                  onChange={checked =>
                    handleSettingsChange('cmdPalette', { ...settingsUpdateData.cmdPalette, isDisabled: checked })
                  }
                />
              </div>
              <div
                className={cn('flex items-center justify-between pr-1 mb-2', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.cmdPalette.isDisabled,
                })}>
                <p className="text-[12px]  font-light tracking-wide ml-1">Include Bookmarks in search</p>
                <Switch
                  size="medium"
                  id="include-bookmark-in-search"
                  disabled={settingsUpdateData.cmdPalette.isDisabled}
                  checked={settingsUpdateData.cmdPalette.includeBookmarksInSearch}
                  onChange={checked =>
                    handleSettingsChange('cmdPalette', {
                      ...settingsUpdateData.cmdPalette,
                      includeBookmarksInSearch: checked,
                    })
                  }
                />
              </div>
              <div
                className={cn('flex items-center justify-between pr-1 mb-2', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.cmdPalette.isDisabled,
                })}>
                <p className="text-[12px]  font-light tracking-wide ml-1">Include Notes in search</p>
                <Switch
                  size="medium"
                  id="include-notes-in-search"
                  disabled={settingsUpdateData.cmdPalette.isDisabled}
                  checked={settingsUpdateData.cmdPalette.includeNotesInSearch}
                  onChange={checked =>
                    handleSettingsChange('cmdPalette', {
                      ...settingsUpdateData.cmdPalette,
                      includeNotesInSearch: checked,
                    })
                  }
                />
              </div>

              <hr className="h-[1px] w-full mt-1.5 mb-1 bg-brand-darkBgAccent/25 rounded-lg border-none" />

              <p
                className={cn('text-[12px] font-light tracking-wide ml-1', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.cmdPalette.isDisabled,
                })}>
                Shortcut to open command palette
              </p>
              <div
                className={cn('flex items-center mt-[2.5px]', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.cmdPalette.isDisabled,
                })}>
                <RadioGroup
                  options={[{ label: commandPaletteShortcut, value: commandPaletteShortcut }]}
                  value={commandPaletteShortcut}
                  defaultValue={commandPaletteShortcut}
                  onChange={() => {}}
                  disabled
                />
                <button
                  className={`ml-2.5 flex items-center justify-between gap-x-1 px-2.5 py-1 text-slate-500 text-[10px] font-light rounded
                          bg-brand-darkBg border border-brand-darkBgAccent/40 transition-colors duration-200 hover:text-slate-400/80 disabled:cursor-not-allowed`}
                  onClick={openChromeShortcutSettings}
                  disabled={settingsUpdateData.cmdPalette.isDisabled}>
                  Change Shortcut In Chrome <OpenInNewWindowIcon className="text-slate-600/80" />
                </button>
              </div>

              {/* disabled commands */}
              <div className="flex flex-col items-star px-1">
                <p className="text-[12px] mb-1 font-light tracking-wide ml-px">
                  Disable Commands ({appSettings.cmdPalette.disabledCommands.length})
                </p>
                <Select
                  isMulti
                  menuPlacement="top"
                  menuPosition="fixed"
                  menuPortalTarget={document.querySelector('#preference-container')}
                  isSearchable={true}
                  isClearable={true}
                  closeMenuOnSelect={false}
                  classNames={{
                    control: () =>
                      '!bg-brand-darkBgAccent/70 !border-slate-700/80  !outline-none focus-within:!border-slate-500/90 !shadow-none !max-h-[125px] !overflow-y-auto cc-scrollbar',
                    menu: () => '!bg-brand-darkBgAccent/95',
                    menuList: () => 'cc-scrollbar',
                    option: props =>
                      // eslint-disable-next-line react/prop-types
                      !props.isFocused
                        ? '!text-slate-300 !bg-transparent hover:!bg-brand-darkBg/80 !capitalize'
                        : '!bg-brand-darkBg/80 !text-slate-200 !capitalize ',
                    input: () => '!text-slate-300',
                    indicatorSeparator: () => '!bg-slate-600',
                    dropdownIndicator: () => '!text-slate-500/80',
                    clearIndicator: () => '!text-slate-500/90 hover:!text-slate-500/70 !cursor-pointer',
                    noOptionsMessage: () => '!text-slate-400',
                    multiValue: () => '!bg-brand-darkBg/40 !rounded-md py-[1.5px]',
                    multiValueLabel: () => '!text-slate-300 !capitalize',
                    multiValueRemove: () => 'hover:!bg-rose-300 hover:!text-slate-800',
                  }}
                  placeholder="Select Command"
                  options={enabledCmdOptions}
                  value={
                    appSettings.cmdPalette.disabledCommands.map(cmd => ({
                      label: cmd.replaceAll('-', ' '),
                      value: cmd,
                    })) || []
                  }
                  onChange={selected => {
                    const selectedCommands = selected.map(option => option.value);

                    handleUpdateBlockCommands(selectedCommands as CommandType[]);
                  }}
                />
              </div>
            </BodyContainer>
          </Accordion>

          {/* notes */}
          <Accordion
            id="notes"
            defaultCollapsed
            classes={{
              triggerContainer:
                'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px mb-[3px]',
              triggerIcon: 'scale-[1.1] text-slate-700',
              content:
                'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
            }}
            trigger={<SettingsHeader heading="Notes" />}>
            {/* accordion body */}
            <BodyContainer>
              {/* disable command palette */}
              <div className="flex items-center justify-between pr-1 mb-2">
                <p className="text-[12px]  font-light tracking-wide ml-1">Disable Notes</p>
                <Switch
                  size="medium"
                  id="disable-notes"
                  checked={settingsUpdateData.notes.isDisabled}
                  onChange={checked =>
                    handleSettingsChange('notes', { ...settingsUpdateData.notes, isDisabled: checked })
                  }
                />
              </div>
              {/* notes bubble */}
              <div
                className={cn('flex items-center justify-between pr-1 mb-2', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.notes.isDisabled,
                })}>
                <p className="text-[12px]  font-light tracking-wide ml-1">{'Show notes bubble for all sites'}</p>
                <Switch
                  size="medium"
                  id="show-notes-on-all-sites"
                  checked={settingsUpdateData.notes.showOnAllSites}
                  disabled={settingsUpdateData.notes.isDisabled}
                  onChange={checked =>
                    handleSettingsChange('notes', { ...settingsUpdateData.notes, showOnAllSites: checked })
                  }
                />
              </div>

              <hr className="h-[1px] w-full mt-1.5 mb-1 bg-brand-darkBgAccent/25 rounded-lg border-none" />

              {/* notes position */}
              <p
                className={cn('text-[12px] font-light tracking-wide ml-1', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.notes.isDisabled,
                })}>
                Notes bubble position on sites
              </p>
              <div
                className={cn('flex items-center mt-[2.5px]', {
                  'opacity-70 cursor-not-allowed': settingsUpdateData.notes.isDisabled,
                })}>
                <RadioGroup
                  options={notesBubblePositionOptions}
                  value={settingsUpdateData.notes.bubblePos}
                  defaultValue={notesBubblePositionOptions[1].value}
                  disabled={settingsUpdateData.notes.isDisabled}
                  onChange={value =>
                    handleSettingsChange('notes', {
                      ...settingsUpdateData.notes,
                      bubblePos: value,
                    })
                  }
                />
              </div>
            </BodyContainer>
          </Accordion>

          {/* auto discard tabs */}
          <Accordion
            id="notes"
            defaultCollapsed
            classes={{
              triggerContainer:
                'border-b border-brand-darkBgAccent/30 bg-brand-darkBgAccent/30 rounded-tr-md rounded-tl-md py-px mb-[3px]',
              triggerIcon: 'scale-[1.1] text-slate-700',
              content:
                'bg-brand-darkBgAccent/15 border-b  border-brand-darkBgAccent/30 rounded-br-md rounded-bl-md mb-1',
            }}
            trigger={<SettingsHeader heading="Discard Tabs" />}>
            {/* accordion body */}
            <BodyContainer>
              <div className="flex items-center justify-between pr-1 mb-2">
                <p className="text-[12px]  font-light tracking-wide ml-1">Auto discard tabs</p>
                <Switch
                  size="medium"
                  id="include-bookmark-in-search"
                  checked={settingsUpdateData.autoDiscardTabs.isEnabled}
                  onChange={checked =>
                    handleSettingsChange('autoDiscardTabs', {
                      ...settingsUpdateData.autoDiscardTabs,
                      isEnabled: checked,
                    })
                  }
                />
              </div>
              <p
                className={cn('text-[12px] font-light tracking-wide ml-1', {
                  'opacity-70 cursor-not-allowed': !settingsUpdateData.autoDiscardTabs.isEnabled,
                })}>
                {"Auto discard tabs after they're inactive for x minutes"}
              </p>
              <div
                className={cn('flex items-center mt-[2.5px]', {
                  'opacity-70 cursor-not-allowed': !settingsUpdateData.autoDiscardTabs.isEnabled,
                })}>
                <RadioGroup
                  options={autoDiscardIntervalTimeOptions}
                  value={settingsUpdateData.autoDiscardTabs.discardTabAfterIdleTime + ''}
                  defaultValue={autoDiscardIntervalTimeOptions[1].value}
                  disabled={!settingsUpdateData.autoDiscardTabs.isEnabled}
                  onChange={value =>
                    handleSettingsChange('autoDiscardTabs', {
                      ...settingsUpdateData.autoDiscardTabs,
                      discardTabAfterIdleTime: Number(value),
                    })
                  }
                />
              </div>

              <hr className="h-[1px] w-full my-2  bg-brand-darkBgAccent/25 rounded-lg border-none" />

              <div className="flex flex-col items-star px-1">
                <p className="text-[12px] mb-1 font-light tracking-wide ml-px">
                  Whitelist Sites ({settingsUpdateData.autoDiscardTabs.whitelistedDomains.length})
                </p>
                {/* input box */}
                <input
                  type="text"
                  ref={whitelistInputRef}
                  onKeyDown={ev => {
                    if (ev.code === 'Enter') {
                      handleAddWhitelistDomain();
                    } else {
                      if ((ev.target as HTMLInputElement).getAttribute('data-invalid-domain')) {
                        (ev.target as HTMLInputElement).setAttribute('data-invalid-domain', 'false');
                      }
                    }
                  }}
                  placeholder="Enter site name"
                  className={`w-[90%] text-[11px] text-slate-300 border border-brand-darkBgAccent/50 rounded-md px-2 py-1 bg-brand-darkBgAccent/40 
                               data-[invalid-domain=true]:!bg-rose-400/20 outline-none focus-within:border-slate-600 transition-colors duration-200 placeholder:text-slate-500/80`}
                />
                {/* domain chips */}
                <div className="ml-1 flex items-start justify-start flex-grow flex-wrap max-w-full mt-1.5 overflow-x-hidden overflow-y-auto cc-scrollbar max-h-[100px]">
                  {settingsUpdateData.autoDiscardTabs.whitelistedDomains.length > 0 ? (
                    settingsUpdateData.autoDiscardTabs.whitelistedDomains.map((domain, index) => (
                      <div
                        className="w-fit flex items-center justify-between pl-2.5 pr-1 py-[2.5px] bg-brand-darkBgAccent/30 shadow shadow-brand-darkBg/60 rounded-xl mb-1 mr-1 select-text"
                        key={index}>
                        <span className="text-[9px] text-slate-400/90">{domain}</span>
                        <button
                          onClick={() => handleRemoveWhitelistDomain(domain)}
                          className="bg-brand-darkBgAccent/60 border border-brand-darkBg/40 rounded-full ml-[2.5px] hover:bg-brand-darkBg/10 transition-colors duration-200">
                          <Cross2Icon className="text-slate-500 scale-[0.8]" />
                        </button>
                      </div>
                    ))
                  ) : (
                    <p className="text-slate-500 text-[10px] font-light">No whitelisted sites</p>
                  )}
                </div>
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
        </div>
        {/* save button */}
        {hasSettingsChanged ? (
          <motion.button
            {...bounce}
            className={`absolute bottom-8 left-[30%] mx-auto w-[40%] py-[7px]  tex-[13px] text-slate-700 font-semibold  
                      border border-brand-darkBgAccent/70 rounded-md bg-brand-primary/95 hover:bg-brand-primary/85 transition-colors duration-300`}
            onClick={handleSaveSettings}>
            {snackbar.isLoading ? <Spinner size="sm" /> : 'Save'}
          </motion.button>
        ) : null}
      </div>
    </SlideModal>
  );
};

export default memo(Settings);
