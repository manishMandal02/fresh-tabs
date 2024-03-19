import { IconProps } from '@radix-ui/react-icons/dist/types';
import { CommandType, ThemeColor } from '@root/src/constants/app';
import { ForwardRefExoticComponent } from 'react';
import type { IconType } from 'react-icons';

export interface ICommand {
  index: number;
  type: CommandType;
  label: string;
  icon?: string | IconType | ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;
  metadata?: string | number;
}

export interface ITab {
  id: number;
  url: string;
  title: string;
}

export interface ISpace {
  id: string;
  isSaved: boolean;
  title: string;
  emoji: string;
  windowId: number;
  theme: ThemeColor;
  activeTabIndex: number;
}

export interface INote {
  id: string;
  text: string;
  spaceId: string;
  createdAt: number;
  domain?: string;
  remainderAt?: number;
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

export interface ISiteVisit {
  url: string;
  title: string;
  faviconUrl: string;
  timestamp: number;
}

// time spent in a space in a day
export interface IDailySpaceTimeChunks {
  spaceId: string | null;
  // epoch timestamp
  time: number;
}
export interface IDailySpaceTime {
  // UTC date string
  date: string;
  minutes: number;
}

export interface ISnoozedTab {
  url: string;
  title: string;
  faviconUrl: string;
  snoozedUntil: number;
  snoozedAt: number;
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
  url?: string;
  spaceId?: string;
  tabId?: number;
  spaceTitle?: string;
  searchQuery?: string;
  activeSpace?: ISpace;
  shouldOpenInNewTab?: boolean;
  snoozedUntil?: number;
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
