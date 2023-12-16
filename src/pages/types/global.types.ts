export enum ThemeColor {
  green = '#34d399',
  orange = '#f97316',
  pink = '#d946ef',
}

export interface ITab {
  id: string;
  url: string;
  faviconURI: string;
}

export interface ISpace {
  id: string;
  title: string;
  emoji: string;
  theme: ThemeColor;
  tabs: ITab[];
}
