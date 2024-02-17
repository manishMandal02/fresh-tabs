import { CommandType, ThemeColor } from '@root/src/constants/app';
import type { IconType } from 'react-icons';

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

export interface ISnoozedTab {
  url: string;
  title: string;
  faviconURL: string;
  snoozeUntil: number;
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
  | 'CHECK_CONTENT_SCRIPT_LOADED'
  | 'SHOW_COMMAND_PALETTE'
  | 'SWITCH_TAB'
  | 'SWITCH_SPACE'
  | 'NEW_SPACE'
  | 'MOVE_TAB_TO_SPACE'
  | 'GO_TO_URL'
  | 'WEB_SEARCH'
  | 'DISCARD_TABS'
  | 'SNOOZE_TAB'
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
  shouldOpenInNewTab?: boolean;
  snoozedUntil?: '30min' | '1hr' | '2hr' | '4hr' | '8hr' | '1day' | '2day' | '3d' | '1week' | '1month';
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
