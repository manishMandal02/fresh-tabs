import { ThemeColor } from '../pages/types/global.types';

export enum StorageKeys {
  SPACES = 'SPACES',
}

export const SampleSpace = {
  space: {
    id: 'space1',
    title: 'Chrome management',
    emoji: '📋',
    isSaved: true,
    theme: ThemeColor.teal,
    activeTabIndex: 0,
    windowId: 0,
  },
  tabs: [
    { url: 'https://manishmandal.me', title: 'Manish Mandal', faviconURL: 'https://manishmandal.me/favicon.ico' },
    {
      url: 'https://freshinbox.xyz',
      title: 'Clean Inbox, Total Privacy | FreshInbox',
      faviconURL: 'https://freshinbox.xyz/favicon.ico',
    },
    {
      url: 'https://twitter.com/manishMandalJ',
      title: '(1) Manish Mandal (@manishMandalJ) / X',
      faviconURL: 'https://abs.twimg.com/favicons/twitter.3.ico',
    },
  ],
};
