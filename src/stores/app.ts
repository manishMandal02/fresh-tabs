import { atom } from 'jotai';

import { DefaultAppSettings } from './../constants/app';
import { getAllGroups } from '../services/chrome-storage/groups';
import { getTabsInSpace } from '../services/chrome-storage/tabs';
import {
  IAppSettings,
  IGroup,
  INote,
  INotification,
  ISpace,
  ISpaceWithTabsAndGroups,
  ITab,
  IUser,
} from '../types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// base atom - spaces (holds the base state which is then derived to form other atoms)
const spacesAtom = atom<ISpace[]>([]);

// spaces - crud operations
export const getAllSpacesAtom = atom(get => get(spacesAtom));

export const setSpacesAtom = atom(null, (_get, set, spaces: ISpace[]) => {
  set(spacesAtom, spaces);
});

export const addSpaceAtom = atom(null, (_get, set, space: ISpace) => {
  set(spacesAtom, spaces => [...spaces, space]);
});

export const updateSpaceAtom = atom(null, (_get, set, space: ISpace) => {
  set(spacesAtom, spaces => spaces.map(s => (s.id === space.id ? space : s)));
});

export const reOrderSpacesAtom = atom(null, (_get, set, space: ISpace) => {
  set(spacesAtom, spaces => spaces.map(s => (s.id === space.id ? space : s)));
});

export const removeSpaceAtom = atom(null, (_get, set, spaceId: string) => {
  set(spacesAtom, spaces => spaces.filter(space => space.id !== spaceId));
});

// hold the active space id, used internally to set other atoms
const activeSpaceIdAtom = atom('');

export const getActiveSpaceIdAtom = atom(get => get(activeSpaceIdAtom));

// readonly atom - non active spaces
export const nonActiveSpacesAtom = atom<ISpace[]>(get =>
  get(spacesAtom).filter(space => space.id !== get(activeSpaceIdAtom)),
);

// readonly atom - active space
export const activeSpaceAtom = atom<ISpace>(get => get(spacesAtom).find(s => s.id === get(activeSpaceIdAtom)));

// atom - active space tabs
export const activeSpaceTabsAtom = atom<ITab[]>([]);

//  atom - active space groups
export const activeSpaceGroupsAtom = atom<IGroup[]>([]);

// write only atom - update active space
export const setActiveSpaceAtom = atom(null, async (_get, set, spaceId: string) => {
  // set active space id
  set(activeSpaceIdAtom, spaceId);
  //  set tabs for active space
  const activeSpaceTabs = await getTabsInSpace(spaceId);
  const activeSpaceGroups = await getAllGroups(spaceId);
  set(activeSpaceTabsAtom, activeSpaceTabs);
  set(activeSpaceGroupsAtom, activeSpaceGroups);
});

// *
// user
export const userAtom = atom<IUser>(null as IUser);

// selected tabs for dragging
export const selectedTabsAtom = atom<number[]>([]);

// global notification state
export const userNotificationsAtom = atom<INotification[]>([]);

// global notification state
export const notesAtom = atom<INote[]>([]);

// settings
export const appSettingsAtom = atom<IAppSettings>({ ...DefaultAppSettings });

// global dragging state
export const dragStateAtom = atom<{ isDragging: boolean; type: 'space' | 'tabs' }>({
  isDragging: false,
  type: null,
});

//- modal atoms

//  snackbar
export const snackbarAtom = atom<SnackbarAtom>({
  msg: '',
  show: false,
  isLoading: false,
  isSuccess: false,
});

// settings modal
export const showSettingsModalAtom = atom(false);

// space history modal
export const showSpaceHistoryModalAtom = atom(false);

// snoozed tabs modal
export const showSnoozedTabsModalAtom = atom(false);

// notification
export const showNotificationModalAtom = atom(false);

// user account modal
export const showUserAccountModalAtom = atom(false);

// add new note modal
export const showNoteModalAtom = atom<{ show: boolean; note: Partial<INote> }>({
  show: false,
  note: { text: '' },
});

// create new space modal
export const showNewSpaceModalAtom = atom<{ show: boolean; tabs: ITab[] }>({ show: false, tabs: [] });

// edit space modal
// export const showUpdateSpaceModalAtom = atom<ISpaceWithTabs>(null as ISpaceWithTabs);
export const showUpdateSpaceModalAtom = atom<ISpaceWithTabsAndGroups>(null as ISpaceWithTabsAndGroups);

// delete space modal
export const deleteSpaceModalAtom = atom<{ show: boolean; spaceId: string }>({ show: false, spaceId: '' });
