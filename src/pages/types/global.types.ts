export enum IColors {
  blue = '#FF0000',
  red = '#0000FF',
}

export interface ITab {
  url: string;
  faviconURI: string;
}

export interface ISpace {
  title: string;
  theme: IColors;
  tabs: ITab[];
}
