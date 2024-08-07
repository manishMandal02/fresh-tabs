import { IAppSettings, IPinnedTab, ISpaceWithTabs } from '../types/global.types';
// if changing this then make sure to update the injected.css for command palette\

export const ContentScriptContainerIds = {
  COMMAND_PALETTE: 'fresh-tabs-command-palette-container',
  READING_MODE: 'fresh-tabs-command-reading-mode',
  DOMAIN_NOTES: 'fresh-tabs-domain-notes-container',
  SNACKBAR: 'fresh-tabs-snackbar-container',
} as const;

export const FRESH_TABS_BOOKMARK_TITLE = '#Fresh Tabs ~ ⚠️ Do not delete this, managed by extension.';

export const DISCARD_TAB_URL_PREFIX = 'data:text/html,';

export const SNOOZED_TAB_GROUP_TITLE = '⏰ Snoozed';

export enum ThemeColor {
  Green = '#4ade80',
  Orange = '#fdba74',
  Yellow = '#fde047',
  Blue = '#38bdf8',
  Purple = '#d8b4fe',
  Pink = '#f9a8d4',
  Red = '#fb7185',
  Cyan = '#67e8f9',
  Grey = '#d1d5db',
}

export const CommandType = {
  Link: 'link',
  Note: 'note',
  NewSpace: 'new-space',
  ReadingMode: 'reading-mode',
  NewNote: 'new-note',
  CloseTab: 'close-tab',
  SwitchTab: 'switch-tab',
  WebSearch: 'web-search',
  SnoozeTab: 'snooze-tab',
  NewGroup: 'new-group',
  AddToGroup: 'add-to-group',
  RenameGroup: 'rename-group',
  AddToSpace: 'add-to-space',
  SwitchSpace: 'switch-space',
  DiscardTabs: 'discard-tabs',
  OpenSidePanel: 'open-side-panel',
  OpenPreferencesModal: 'open-preferences-modal',
  OpenSnoozedTabsModal: 'open-snoozed-tabs-modal',
  OpenSpaceHistoryModal: 'open-space-history-modal',
  OpenNotificationsModal: 'open-notifications-modal',
  WhitelistDomainForAutoDiscard: 'whitelist-domain-to-prevent-auto-discard',
} as const;

export type CommandType = (typeof CommandType)[keyof typeof CommandType];

export enum NOTIFICATION_TYPE {
  NOTE_REMAINDER = 'note-remainder',
  UN_SNOOZED_TAB = 'un-snoozed-tab',
  ACCOUNT = 'account',
}

export const ALARM_NAME_PREFiX = {
  deleteSpace: 'deleteSpace',
  snoozedTab: 'snoozedTab',
  noteRemainder: 'noteRemainder',
} as const;

export const AlarmName = {
  autoSaveBM: 'auto-save-to-bm',
  autoDiscardTabs: 'auto-discard-tabs',
  dailyMidnightTrigger: 'daily-midnight-trigger',
  deleteSpace: (spaceId: string): `${typeof ALARM_NAME_PREFiX.deleteSpace}-${string}` =>
    `${ALARM_NAME_PREFiX.deleteSpace}-${spaceId}`,
  snoozedTab: (spaceId: string): `${typeof ALARM_NAME_PREFiX.snoozedTab}-${string}` =>
    `${ALARM_NAME_PREFiX.snoozedTab}-${spaceId}`,
  noteRemainder: (noteId: string): `${typeof ALARM_NAME_PREFiX.noteRemainder}-${string}` =>
    `${ALARM_NAME_PREFiX.noteRemainder}-${noteId}`,
} as const;

export const StorageKey = {
  USER_TOKEN: 'USER_TOKEN',
  USER: 'USER',
  SPACES: 'SPACES',
  NOTES: 'NOTES',
  SETTINGS: 'SETTINGS',
  PINNED_TABS: 'PINNED_TABS',
  NOTIFICATIONS: 'NOTIFICATIONS',
  TEMP_POPUP_WINDOW: 'TEMP_POPUP_WINDOW',
  LINK_PREVIEW_POPUP_WINDOW: 'LINK_PREVIEW_POPUP_WINDOW',
  DAILY_SPACE_TIME_CHUNKS: 'DAILY_SPACE_TIME_CHUNKS',
  tabs: (spaceId: string): `TABS-${string}` => `TABS-${spaceId}`,
  groups: (spaceId: string): `GROUPS-${string}` => `GROUPS-${spaceId}`,
  spaceContainer: (spaceId: string): `SPACE_CONTAINER-${string}` => `SPACE_CONTAINER-${spaceId}`,
  snoozed: (spaceId: string): `SNOOZED-${string}` => `SNOOZED-${spaceId}`,
  dailySpaceTimeAll: (spaceId: string): `DAILY_SPACE_TIME_ALL-${string}` => `DAILY_SPACE_TIME_ALL-${spaceId}`,
  spaceHistoryAll: (spaceId: string): `SPACE_HISTORY_ALL-${string}` => `SPACE_HISTORY_ALL-${spaceId}`,
  spaceHistoryToday: (spaceId: string): `SPACE_HISTORY_TODAY-${string}` => `SPACE_HISTORY_TODAY-${spaceId}`,
} as const;

export const ContextMenuItem = {
  OPEN_APP: 'Open App',
  SNOOZE_TAB: 'Snooze tab ⏰',
  DISCARD_TABS: 'Discard other tabs',
} as const;

export const ContextMenuSnoozeOptions = ['2 hr', '6 hr', '1 day', '2 day', '1 week'];

export const DefaultAppSettings: IAppSettings = {
  openSpace: 'newWindow',
  autoSaveToBookmark: 'daily',
  deleteUnsavedSpace: 'immediately',
  autoDiscardTabs: { isEnabled: true, discardTabAfterIdleTime: 10, whitelistedDomains: [] },
  cmdPalette: { isDisabled: false, includeBookmarksInSearch: true, includeNotesInSearch: false, disabledCommands: [] },
  linkPreview: { isDisabled: false, openTrigger: 'shift-click', size: 'tablet' },
  notes: { isDisabled: false, showOnAllSites: true, bubblePos: 'bottom-left' },
};

export const DefaultPinnedTabs: IPinnedTab[] = [
  { url: 'https://www.google.com', title: 'Google' },
  { url: 'https://twitter.com', title: 'Twitter' },
  { url: 'https://mail.google.com/mail/u/0/#inbox', title: 'Gmail' },
  { url: 'https://reddit.com', title: 'Reddit' },
];

export const SampleSpaces: ISpaceWithTabs[] = [
  {
    id: 'space1',
    emoji: '🏗️',
    title: 'Extension Developer',
    isSaved: true,
    theme: ThemeColor.Cyan,
    activeTabIndex: 0,
    windowId: 0,
    tabs: [
      {
        id: 0,
        url: 'https://manishmandal.com',
        faviconUrl: 'https://manishmandal.com/favicon.ico',
        title: 'Manish Mandal',
        index: 0,
      },
      {
        id: 0,
        url: 'https://freshinbox.xyz',
        title: 'Clean Inbox, Total Privacy | FreshInbox',
        faviconUrl: 'https://freshinbox.xyz/favicon.ico',
        index: 1,
      },
    ],
  },
  {
    id: 'space2',
    title: 'Side Projects',
    emoji: '🚀',
    isSaved: true,
    theme: ThemeColor.Purple,
    activeTabIndex: 0,
    windowId: 0,
    tabs: [
      {
        id: 0,
        url: 'https://manishmandal.com',
        title: 'Manish Mandal',
        faviconUrl: 'https://manishmandal.com/favicon.ico',
        index: 0,
      },
      {
        id: 0,
        url: 'https://github.com/manishMandal02',
        title: 'manishMandal02 (Manish Mandal)',
        faviconUrl: 'https://github.com/favicon.ico',
        index: 1,
      },
    ],
  },
];
