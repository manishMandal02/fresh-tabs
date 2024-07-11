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

// user preferences and setting
type CommandPaletteSettings = {
  isDisabled: boolean;
  includeBookmarksInSearch: boolean;
  includeNotesInSearch: boolean;
};

type LinkPreviewSettings = {
  isDisabled: boolean;
  openTrigger: 'all-external' | 'shift-click';
  size: 'mobile' | 'tablet' | 'desktop';
};

export type NoteBubblePos = 'bottom-left' | 'bottom-right';

type NoteSettings = {
  isDisabled: boolean;
  bubblePos: NoteBubblePos;
  showOnAllSites: boolean;
};

type AutoDiscardTabSettings = {
  isEnabled: boolean;
  discardTabAfterIdleTime: number;
  whitelistedDomains: string[];
};

export interface IAppSettings {
  notes: NoteSettings;
  cmdPalette: CommandPaletteSettings;
  linkPreview: LinkPreviewSettings;
  autoDiscardTabs: AutoDiscardTabSettings;
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
  isFeatured?: boolean;
}

interface AccountNotification {
  id: string;
  timestamp: number;
  type: NOTIFICATION_TYPE.ACCOUNT;
  title: string;
  message: string;
}
interface NoteRemainderNotification {
  id: string;
  timestamp: number;
  type: NOTIFICATION_TYPE.NOTE_REMAINDER;
  note: Pick<INote, 'id' | 'title' | 'domain'>;
}
interface UnSnoozedTabNotification {
  id: string;
  timestamp: number;
  type: NOTIFICATION_TYPE.UN_SNOOZED_TAB;
  snoozedTab: Pick<ISnoozedTab, 'url' | 'title' | 'faviconUrl'>;
}

export type INotification = AccountNotification | NoteRemainderNotification | UnSnoozedTabNotification;

export interface ISpace {
  id: string;
  isSaved: boolean;
  title: string;
  emoji: string;
  windowId: number;
  theme: ThemeColor;
  activeTabIndex: number;
}
export interface ITab {
  id: number;
  url: string;
  title: string;
  index: number;
  faviconUrl: string;
  groupId?: number;
}

export interface IGroup {
  id: number;
  name: string;
  collapsed: boolean;
  theme: chrome.tabGroups.ColorEnum;
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

export interface IContainerData {
  domain: string;
  cookie: string;
  localStorage: unknown;
}

export interface IContainer {
  id: string;
  spaceId: string;
  type: 'space' | 'group';
  // domain is the key
  data: Record<string, IContainerData>;
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
  | 'OPEN_MODAL'
  | 'UPDATE_NOTIFICATIONS';

type OpenSidePanelModal = 'notifications' | 'preferences' | 'space-history' | 'snoozed-tabs';

interface IEventPayloadSidePanel {
  spaceId?: string;
  space?: ISpace | ISpaceWithTabs;
  openSidePanelModal?: OpenSidePanelModal;
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
  | 'SHOW_COMMAND_PALETTE'
  | 'WHITE_LIST_DOMAIN_FOR_AUTO_DISCARD'
  | 'MOVE_TAB_TO_SPACE'
  | 'SHOW_DOMAIN_NOTES'
  | 'SHOW_SNACKBAR'
  | 'SWITCH_SPACE'
  | 'NEW_SPACE'
  | 'NEW_GROUP'
  | 'ADD_TO_GROUP'
  | 'RENAME_GROUP'
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
  searchResLimit?: number;
  snoozedUntil?: number;
  activeSpace?: ISpace;
  noteRemainder?: string;
  isOpenedInPopupWindow?: boolean;
  shouldOpenInNewTab?: boolean;
  shouldCloseCurrentTab?: boolean;
  shouldOpenInNewWindow?: boolean;
  openSidePanelModal?: OpenSidePanelModal;
  notesBubblePos?: NoteBubblePos;
  shouldIgnoreDiscardWhitelist?: boolean;
  searchFilterPreferences?: ISearchFilters;
}

export interface IMessageEventContentScript {
  event: MessageEventsContentScript;
  payload?: IEventPayloadContentScript;
}
