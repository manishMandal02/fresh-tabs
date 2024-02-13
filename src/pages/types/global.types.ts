import type { IconType } from 'react-icons';

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
  RecentSite = 'recent-site',
  SwitchTab = 'switch-tab',
  TopSite = 'top-site',
  Divider = 'divider',
}

export interface ICommand {
  index: number;
  type: CommandType;
  label: string;
  icon?: string | IconType;
  metadata?: string | number;
}

export interface ITab {
  id: number;
  url: string;
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

export interface IPinnedTab {
  url: string;
  title?: string;
}

export type ISpaceWithoutId = Omit<ISpace, 'id'>;

export interface ISpaceWithTabs extends ISpace {
  tabs: ITab[];
}

export interface ITabWithIndex extends ITab {
  index: number;
}

type MessageEventsSidePanel = 'UPDATE_SPACE_ACTIVE_TAB' | 'UPDATE_TABS' | 'REMOVE_SPACE' | 'ADD_SPACE';

interface IEventPayloadSidePanel {
  spaceId?: string;
  space?: ISpace | ISpaceWithTabs;
  newActiveIndex?: number;
}

export interface IMessageEventSidePanel {
  event: MessageEventsSidePanel;
  id: string;
  payload: IEventPayloadSidePanel;
}

type MessageEventsContentScript =
  | 'SHOW_COMMAND_PALETTE'
  | 'SWITCH_TAB'
  | 'SWITCH_SPACE'
  | 'NEW_SPACE'
  | 'MOVE_TAB_TO_SPACE'
  | 'GO_TO_URL'
  | 'SEARCH';

interface IEventPayloadContentScript {
  recentSites?: ITab[];
  topSites?: ITab[];
  url?: string;
  spaceId?: string;
  tabId?: number;
  spaceTitle?: string;
  searchQuery?: string;
  activeSpace?: ISpace;
}

export interface IMessageEventContentScript {
  event: MessageEventsContentScript;
  payload?: IEventPayloadContentScript;
}

export interface IAppSettings {
  includeBookmarksInSearch: boolean;
  deleteUnsavedSpace: 'immediately' | 'week';
  openSpace: 'newWindow' | 'sameWindow';
  autoSaveToBookmark: 'off' | 'daily' | 'weekly';
}
