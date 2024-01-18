import { IAppSettings, IPinnedTab, ISpaceWithTabs, ThemeColor } from '../pages/types/global.types';

export const FRESH_TABS_BOOKMARK_TITLE = '#Fresh Tabs ~ ⚠️ Do not delete this, managed by extension.';

export const DiscardTabURLPrefix = 'data:text/html,';

export const AlarmNames = {
  deleteSpace: (spaceId: string) => `deleteSpace-${spaceId}`,
  saveToBM: 'SaveToBookmark',
};

export enum StorageKeys {
  SPACES = 'SPACES',
  SETTINGS = 'SETTINGS',
  PinnedTabs = 'PinnedTabs',
}

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
