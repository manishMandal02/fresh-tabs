import { atom } from 'jotai';
import { ISpaceWithTabs } from '../pages/types/global.types';

type SnackbarAtom = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

// global snackbar  state
export const snackbarAtom = atom<SnackbarAtom>({ msg: '', show: false, isLoading: false, isSuccess: false });

// global spaces state
export const spacesAtom = atom<ISpaceWithTabs[]>([]);
