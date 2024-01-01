import { IAppSettings, ThemeColor } from '../pages/types/global.types';

export const FRESH_TABS_BOOKMARK_TITLE = '#Fresh Tabs ~ ⚠️ Do not delete this, managed by extension.';

export const DiscardTabURLPrefix = 'data:text/html,';

export enum StorageKeys {
  SPACES = 'SPACES',
  SETTINGS = 'SETTINGS',
  BOOKMARK_ID = 'BOOKMARK_ID',
}

export const defaultAppSettings: IAppSettings = {
  includeBookmarksInSearch: false,
  activeSpaceExpanded: true,
  deleteUnsavedSpace: 'immediately',
  openSpace: 'newWindow',
  autoSaveToBookmark: 'daily',
  shortCutToOpenApp: 'cmd+e',
};

export const SampleSpaces = [
  {
    space: {
      id: 'space1',
      emoji: '🏗️',
      title: 'Extension Developer',
      isSaved: true,
      theme: ThemeColor.Teal,
      activeTabIndex: 0,
      windowId: 0,
    },
    tabs: [
      {
        id: 0,
        url: 'https://manishmandal.me',
        title: 'Manish Mandal',
        faviconURL: 'https://www.google.com/s2/favicons?domain=manishmandal.me&sz=32',
      },
      {
        id: 0,
        url: 'https://freshinbox.xyz',
        title: 'Clean Inbox, Total Privacy | FreshInbox',
        faviconURL: 'https://www.google.com/s2/favicons?domain=freshinbox.xyz&sz=32',
      },
      {
        id: 0,
        url: 'https://twitter.com/manishMandalJ',
        title: '(1) Manish Mandal (@manishMandalJ) / X',
        faviconURL: 'https://www.google.com/s2/favicons?domain=twitter.com&sz=32',
      },
    ],
  },
  {
    space: {
      id: 'space2',
      title: 'Side Projects',
      emoji: '🚀',
      isSaved: true,
      theme: ThemeColor.Purple,
      activeTabIndex: 0,
      windowId: 0,
    },
    tabs: [
      {
        id: 0,
        url: 'https://manishmandal.me',
        title: 'Manish Mandal',
        faviconURL: 'https://www.google.com/s2/favicons?domain=manishmandal.me&sz=32',
      },
      {
        id: 0,
        url: 'https://github.com/manishMandal02',
        title: 'manishMandal02 (Manish Mandal)',
        faviconURL: 'https://www.google.com/s2/favicons?domain=github.com&sz=32',
      },
    ],
  },
];
