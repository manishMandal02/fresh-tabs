import { ThemeColor } from '../pages/types/global.types';

export enum StorageKeys {
  SPACES = 'SPACES',
}

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
