import { IconProps } from '@radix-ui/react-icons/dist/types';
import { CommandType, NOTIFICATION_TYPE, ThemeColor } from '@root/src/constants/app';
import { ForwardRefExoticComponent, HTMLProps } from 'react';

export type RadixIconType = ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

export type CSSClasses = HTMLProps<HTMLElement>['className'];

export interface ISearchFilters {
  searchBookmarks: boolean;
  searchNotes: boolean;
}

export interface ICommand {
  index: number;
  label: string;
  alias?: string;
  type: CommandType;
  metadata?: string | number;
  icon: string | RadixIconType;
}

interface AccountNotification {
  type: NOTIFICATION_TYPE.ACCOUNT;
  id: string;
  timestamp: number;
  message: string;
}
interface NoteRemainderNotification {
  type: NOTIFICATION_TYPE.NOTE_REMAINDER;
  id: string;
  timestamp: number;
  note: INote;
}
interface UnSnoozedTabNotification {
  type: NOTIFICATION_TYPE.UN_SNOOZED_TAB;
  id: string;
  timestamp: number;
  snoozedTab: ISnoozedTab;
}

export type INotification = AccountNotification | NoteRemainderNotification | UnSnoozedTabNotification;

export interface ITab {
  id: number;
  url: string;
  title: string;
  index: number;
  groupId?: number;
}

export interface IGroup {
  id: number;
  name: string;
  collapsed: boolean;
  theme: chrome.tabGroups.ColorEnum;
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
  title: string;
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
export interface ISpaceWithTabsAndGroups extends ISpace {
  tabs: ITab[];
  groups: IGroup[];
}
export interface ISiteVisit {
  url: string;
  title: string;
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

type MessageEventsSidePanel =
  | 'UPDATE_SPACE_ACTIVE_TAB'
  | 'UPDATE_TABS'
  | 'UPDATE_GROUPS'
  | 'REMOVE_SPACE'
  | 'ADD_SPACE'
  | 'TABS_DISCARDED';

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
  | 'SHOW_DOMAIN_NOTES'
  | 'SHOW_SNACKBAR'
  | 'SWITCH_TAB'
  | 'SWITCH_SPACE'
  | 'NEW_SPACE'
  | 'NEW_NOTE'
  | 'EDIT_NOTE'
  | 'DELETE_NOTE'
  | 'MOVE_TAB_TO_SPACE'
  | 'GO_TO_URL'
  | 'WEB_SEARCH'
  | 'DISCARD_TABS'
  | 'SNOOZE_TAB'
  | 'CLOSE_TAB'
  | 'SEARCH';

interface IEventPayloadContentScript {
  url?: string;
  note?: string;
  tabId?: number;
  noteId?: string;
  spaceId?: string;
  spaceTitle?: string;
  noteTitle?: string;
  snackbarMsg?: string;
  searchQuery?: string;
  snoozedUntil?: number;
  recentSites?: ITab[];
  activeSpace?: ISpace;
  noteRemainder?: string;
  shouldOpenInNewTab?: boolean;
  shouldCloseCurrentTab?: boolean;
  shouldOpenInNewWindow?: boolean;
  notesBubblePos?: NoteBubblePos;
  searchFilterPreferences?: ISearchFilters;
}

export interface IMessageEventContentScript {
  event: MessageEventsContentScript;
  payload?: IEventPayloadContentScript;
}

export type NoteBubblePos = 'bottom-left' | 'bottom-right';

export interface IAppSettings {
  includeBookmarksInSearch: boolean;
  isCommandPaletteDisabled: boolean;
  isNotesDisabled: boolean;
  includeNotesInSearch: boolean;
  notesBubblePos: NoteBubblePos;
  showNotesBubbleForAllSites: boolean;
  deleteUnsavedSpace: 'immediately' | 'week';
  openSpace: 'newWindow' | 'sameWindow';
  autoSaveToBookmark: 'off' | 'daily' | 'weekly';
}
