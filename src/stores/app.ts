import { atom } from 'jotai';

type SnackbarAton = {
  show: boolean;
  msg: string;
  isLoading?: boolean;
  isSuccess?: boolean;
};

export const snackbarAtom = atom<SnackbarAton>({ msg: '', show: false, isLoading: false, isSuccess: false });
