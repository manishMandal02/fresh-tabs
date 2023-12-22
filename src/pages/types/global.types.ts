export enum ThemeColor {
  green = '#34d399',
  orange = '#f97316',
  fuchsia = '#d946ef',
  yellow = '#fbbf24',
  blue = '#38bdf8',
  indigo = '#6366f1',
  purple = '#c084fc',
  pink = '#f472b6',
  red = '#f43f5e',
  teal = '#5eead4',
}

export interface ITab {
  url: string;
  faviconURL: string;
  title: string;
}

export type GrayColor = '#94a3b8';

export interface ISpace {
  id: string;
  isSaved: boolean;
  title: string;
  emoji: string;
  windowId: number;
  theme: ThemeColor | GrayColor;
  activeTabIndex: number;
}

export type ISpaceWithoutId = Omit<ISpace, 'id'>;

export interface ISpaceWithTabs extends ISpace {
  tabs: ITab[];
}
