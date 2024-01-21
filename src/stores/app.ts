import { DefaultAppSettings } from './../constants/app';
import { atom } from 'jotai';
import { IAppSettings, ISpace, ISpaceWithTabs, ITab } from '../pages/types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// non active spaces state
export const nonActiveSpacesAtom = atom<ISpace[]>([]);

// active space
export const activeSpaceAtom = atom<ISpaceWithTabs>(null as ISpaceWithTabs);

// selected tabs for dragging
export const selectedTabsAtom = atom<ITab[]>([]);

//  settings state
export const appSettingsAtom = atom<IAppSettings>({ ...DefaultAppSettings });

//  snackbar  state
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });
