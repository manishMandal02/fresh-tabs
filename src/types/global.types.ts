import { IconProps } from '@radix-ui/react-icons/dist/types';
import { CommandType, NOTIFICATION_TYPE, ThemeColor } from '@root/src/constants/app';
import { ForwardRefExoticComponent, HTMLProps } from 'react';

export type RadixIconType = ForwardRefExoticComponent<IconProps & React.RefAttributes<SVGSVGElement>>;

export type CSSClasses = HTMLProps<HTMLElement>['className'];

export interface IUser {
  id: string;
  email: string;
  name: string;
  profilePicUrl?: string;
  plan: 'monthly' | 'lifetime';
  expiresAt: number;
}

export interface IUserPlan {}

export interface IUserToken {
  token: string;
  expiresAt: number;
}

export interface IAppSettings {
  includeBookmarksInSearch: boolean;
  isCommandPaletteDisabled: boolean;
  isLinkPreviewDisabled: boolean;
  openLinkPreviewType: 'all-external' | 'shift-click';
  linkPreviewSize: 'mobile' | 'tablet' | 'desktop';
  isNotesDisabled: boolean;
  includeNotesInSearch: boolean;
  notesBubblePos: NoteBubblePos;
  showNotesBubbleForAllSites: boolean;
  openSpace: 'newWindow' | 'sameWindow';
  deleteUnsavedSpace: 'immediately' | 'week';
  autoSaveToBookmark: 'off' | 'daily' | 'weekly';
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
  title: string;
  message: string;
}
interface NoteRemainderNotification {
  type: NOTIFICATION_TYPE.NOTE_REMAINDER;
  id: string;
  timestamp: number;
  note: Pick<INote, 'id' | 'title' | 'domain'>;
}
interface UnSnoozedTabNotification {
  type: NOTIFICATION_TYPE.UN_SNOOZED_TAB;
  id: string;
  timestamp: number;
  snoozedTab: Pick<ISnoozedTab, 'url' | 'title' | 'faviconUrl'>;
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

export interface ISearchFilters {
  searchBookmarks: boolean;
  searchNotes: boolean;
}

type MessageEventsSidePanel =
  | 'UPDATE_SPACE_ACTIVE_TAB'
  | 'UPDATE_TABS'
  | 'UPDATE_GROUPS'
  | 'UPDATE_NOTES'
  | 'REMOVE_SPACE'
  | 'ADD_SPACE'
  | 'TABS_DISCARDED'
  | 'UPDATE_NOTIFICATIONS';

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
  | 'OPEN_LINK_PREVIEW_POPUP'
  | 'POPUP_PREVIEW_BUTTON_OVERLAY'
  | 'OPEN_PREVIEW_LINK_AS_TAB'
  | 'OPEN_APP_SIDEPANEL'
  | 'OPEN_APP_SIDEPANEL_ACTION'
  | 'SHOW_COMMAND_PALETTE'
  | 'MOVE_TAB_TO_SPACE'
  | 'SHOW_DOMAIN_NOTES'
  | 'SHOW_SNACKBAR'
  | 'SWITCH_SPACE'
  | 'NEW_SPACE'
  | 'NEW_GROUP'
  | 'ADD_TO_GROUP'
  | 'SWITCH_TAB'
  | 'NEW_NOTE'
  | 'EDIT_NOTE'
  | 'DELETE_NOTE'
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
  windowId?: number;
  noteId?: string;
  spaceId?: string;
  spaceTitle?: string;
  groupId?: number;
  groupName?: string;
  noteTitle?: string;
  snackbarMsg?: string;
  searchQuery?: string;
  snoozedUntil?: number;
  recentSites?: ITab[];
  activeSpace?: ISpace;
  noteRemainder?: string;
  isOpenedInPopupWindow?: boolean;
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
