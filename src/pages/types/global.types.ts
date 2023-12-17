export enum ThemeColor {
  green = '#34d399',
  orange = '#f97316',
  pink = '#d946ef',
}

export interface ITab {
  id: string | number;
  url: string;
  faviconURI: string;
}

export type GrayColor = '#94a3b8';

export interface ISpace {
  id: string;
  isSaved: boolean;
  title: string;
  emoji: string;
  theme: ThemeColor | GrayColor;
  tabs: ITab[];
}
