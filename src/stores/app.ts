import { DefaultAppSettings } from './../constants/app';
import { atom } from 'jotai';
import { IAppSettings, ISpace } from '../pages/types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// global spaces state
export const spacesAtom = atom<ISpace[]>([]);

// global settings state
export const appSettingsAtom = atom<IAppSettings>({ ...DefaultAppSettings });

// global snackbar  state
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });
