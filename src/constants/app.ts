import { IAppSettings, IPinnedTab, ISpaceWithTabs } from '../pages/types/global.types';

export const CommandPaletteContainerId = 'fresh-tabs-command-palette-container';

export const FRESH_TABS_BOOKMARK_TITLE = '#Fresh Tabs ~ ⚠️ Do not delete this, managed by extension.';

export const DiscardTabURLPrefix = 'data:text/html,';

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
}

export enum CommandType {
  NewSpace = 'new-space',
  SwitchSpace = 'switch-space',
  AddToSpace = 'add-to-space',
  SwitchTab = 'switch-tab',
  WebSearch = 'web-search',
  RecentSite = 'recent-site',
  TopSite = 'top-site',
  DiscardTabs = 'discard-tabs',
  SnoozeTab = 'snooze-tab',
}

export type AlarmName = 'auto-save-to-bm' | 'auto-discard-tabs' | `deleteSpace-${string}` | `snoozedTab-${string}`;

export const StorageKeys = {
  SPACES: 'SPACES',
  SETTINGS: 'SETTINGS',
  PinnedTabs: 'PinnedTabs',
  TABS: (spaceId: string) => `TABS-${spaceId}`,
  SNOOZED_TABS: (spaceId: string) => `SNOOZED-${spaceId}`,
};

export const DefaultAppSettings: IAppSettings = {
  includeBookmarksInSearch: false,
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
