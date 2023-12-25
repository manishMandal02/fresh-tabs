export enum ThemeColor {
  Green = '#34d399',
  Orange = '#f97316',
  Fuchsia = '#d946ef',
  Yellow = '#fbbf24',
  Blue = '#38bdf8',
  Indigo = '#6366f1',
  Purple = '#c084fc',
  Pink = '#f472b6',
  Red = '#f43f5e',
  Teal = '#5eead4',
}

export interface ITab {
  id: number;
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

type MessageEvents = 'UPDATE_SPACE_ACTIVE_TAB' | 'UPDATE_TABS' | 'REMOVE_SPACE' | 'ADD_SPACE';

interface IEventPayload {
  spaceId?: string;
  space?: ISpace | ISpaceWithTabs;
  newActiveIndex?: number;
}

export interface IMessageEvent {
  event: MessageEvents;
  id: string;
  payload: IEventPayload;
}
