import { DefaultAppSettings } from './../constants/app';
import { atom } from 'jotai';
import { IAppSettings, ISpace, ISpaceWithTabs, ITab, ITabWithIndex } from '../pages/types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// global states/atoms

// non active spaces
export const nonActiveSpacesAtom = atom<ISpace[]>([]);

// TODO - derive this atom from the space id atom top-down approach
// active space
export const activeSpaceAtom = atom<ISpaceWithTabs>(null as ISpaceWithTabs);

// active space id
export const activeSpaceIdAtom = atom(get => get(activeSpaceAtom).id);

// selected tabs for dragging
export const selectedTabsAtom = atom<ITabWithIndex[]>([]);

//  settings
export const appSettingsAtom = atom<IAppSettings>({ ...DefaultAppSettings });

//  snackbar
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });

// global dragging state
export const dragStateAtom = atom<{ isDragging: boolean; type: 'space' | 'tabs' }>({
  isDragging: false,
  type: null,
});

// settings modal
export const showSettingsModalAtom = atom<boolean>(false);

// create new space modal
export const newSpaceModalAtom = atom<{ show: boolean; tabs: ITab[] }>({ show: false, tabs: [] });

// edit space modal
export const updateSpaceModalAtom = atom<ISpaceWithTabs>(null as ISpaceWithTabs);

// delete space modal
export const deleteSpaceModalAtom = atom<{ show: boolean; spaceId: string }>({ show: false, spaceId: '' });
