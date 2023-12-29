import { defaultAppSettings } from './../constants/app';
import { atom } from 'jotai';
import { IAppSettings, ISpaceWithTabs } from '../pages/types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// global spaces state
export const spacesAtom = atom<ISpaceWithTabs[]>([]);

// global settings state
export const appSettingsAtom = atom<IAppSettings>({ ...defaultAppSettings });

// global snackbar  state
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });
