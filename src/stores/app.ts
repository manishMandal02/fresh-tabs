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

// active space
export const activeSpaceAtom = atom<ISpaceWithTabs>(null as ISpaceWithTabs);

// selected tabs for dragging
export const selectedTabsAtom = atom<ITabWithIndex[]>([]);

//  settings
export const appSettingsAtom = atom<IAppSettings>({ ...DefaultAppSettings });

//  snackbar
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });

// create new space modal
export const newSpaceModalAtom = atom<{ show: boolean; tabs: ITab[] }>({ show: false, tabs: [] });

// edit space modal
export const updateSpaceModalAtom = atom<ISpaceWithTabs>(null as ISpaceWithTabs);

// delete space modal
export const deleteSpaceModalAtom = atom<{ show: boolean; spaceId: string }>({ show: false, spaceId: '' });
