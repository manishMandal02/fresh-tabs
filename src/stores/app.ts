import { DefaultAppSettings } from './../constants/app';
import { atom } from 'jotai';
import { IAppSettings, ISpace, ISpaceWithTabs, ThemeColor } from '../pages/types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// global spaces state
export const spacesAtom = atom<ISpace[]>([]);

// global spaces state
export const activeSpaceAtom = atom<ISpaceWithTabs>({
  id: '',
  tabs: [],
  theme: ThemeColor.Blue,
  windowId: 0,
  title: '',
  emoji: '',
  activeTabIndex: 0,
  isSaved: false,
});

// global settings state
export const appSettingsAtom = atom<IAppSettings>({ ...DefaultAppSettings });

// global snackbar  state
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });
