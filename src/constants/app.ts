import { IAppSettings, IPinnedTab, ISpaceWithTabs } from '../types/global.types';
// if changing this then make sure to update the injected.css for command palette\

export const ContentScriptContainerIds = {
  COMMAND_PALETTE: 'fresh-tabs-command-palette-container',
  DOMAIN_NOTES: 'fresh-tabs-domain-notes-container',
  SNACKBAR: 'fresh-tabs-snackbar-container',
} as const;

export const FRESH_TABS_BOOKMARK_TITLE = '#Fresh Tabs ~ ⚠️ Do not delete this, managed by extension.';

export const DISCARD_TAB_URL_PREFIX = 'data:text/html,';

export const SNOOZED_TAB_GROUP_TITLE = '⏰ Snoozed';

export enum ThemeColor {
  Green = '#34d399',
  Orange = '#f97316',
  Yellow = '#fbbf24',
  Blue = '#38bdf8',
  Purple = '#c084fc',
  Pink = '#f472b6',
  Red = '#f43f5e',
  Indigo = '#6366f1',
  Teal = '#5eead4',
  Fuchsia = '#d946ef',
  Grey = '#94a3b8',
}

export enum CommandType {
  Link = 'link',
  // show note in search
  Note = 'note',
  NewSpace = 'new-space',
  NewNote = 'new-note',
  CloseTab = 'close-tab',
  SwitchTab = 'switch-tab',
  WebSearch = 'web-search',
  SnoozeTab = 'snooze-tab',
  AddToSpace = 'add-to-space',
  SwitchSpace = 'switch-space',
  DiscardTabs = 'discard-tabs',
}

export const ALARM_NAME_PREFiX = {
  deleteSpace: 'deleteSpace',
  snoozedTab: 'snoozedTab',
} as const;

export const AlarmName = {
  autoSaveBM: 'auto-save-to-bm',
  autoDiscardTabs: 'auto-discard-tabs',
  dailyMidnightTrigger: 'daily-midnight-trigger',
  deleteSpace: (spaceId: string): `${typeof ALARM_NAME_PREFiX.deleteSpace}-${string}` =>
    `${ALARM_NAME_PREFiX.deleteSpace}-${spaceId}`,
  snoozedTab: (spaceId: string): `${typeof ALARM_NAME_PREFiX.snoozedTab}-${string}` =>
    `${ALARM_NAME_PREFiX.snoozedTab}-${spaceId}`,
} as const;

export const StorageKey = {
  SPACES: 'SPACES',
  NOTES: 'NOTES',
  SETTINGS: 'SETTINGS',
  PINNED_TABS: 'PINNED_TABS',
  DAILY_SPACE_TIME_CHUNKS: 'DAILY_SPACE_TIME_CHUNKS',
  tabs: (spaceId: string): `TABS-${string}` => `TABS-${spaceId}`,
  snoozed: (spaceId: string): `SNOOZED-${string}` => `SNOOZED-${spaceId}`,
  dailySpaceTimeAll: (spaceId: string): `DAILY_SPACE_TIME_ALL-${string}` => `DAILY_SPACE_TIME_ALL-${spaceId}`,
  spaceHistoryAll: (spaceId: string): `SPACE_HISTORY_ALL-${string}` => `SPACE_HISTORY_ALL-${spaceId}`,
  spaceHistoryToday: (spaceId: string): `SPACE_HISTORY_TODAY-${string}` => `SPACE_HISTORY_TODAY-${spaceId}`,
} as const;

// union type of all storage value (SPACES, TABS-${string}, etc.)

export const DefaultAppSettings: IAppSettings = {
  includeBookmarksInSearch: true,
  includeNotesInSearch: false,
  deleteUnsavedSpace: 'immediately',
  openSpace: 'newWindow',
  autoSaveToBookmark: 'daily',
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
    theme: ThemeColor.Teal,
    activeTabIndex: 0,
    windowId: 0,
    tabs: [
      {
        id: 0,
        url: 'https://manishmandal.me',
        title: 'Manish Mandal',
      },
      {
        id: 0,
        url: 'https://freshinbox.xyz',
        title: 'Clean Inbox, Total Privacy | FreshInbox',
      },
      {
        id: 0,
        url: 'https://twitter.com/manishMandalJ',
        title: '(1) Manish Mandal (@manishMandalJ) / X',
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
        url: 'https://manishmandal.me',
        title: 'Manish Mandal',
      },
      {
        id: 0,
        url: 'https://github.com/manishMandal02',
        title: 'manishMandal02 (Manish Mandal)',
      },
    ],
  },
];
