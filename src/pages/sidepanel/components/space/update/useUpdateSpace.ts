import { ISpaceWithoutId } from '@root/src/pages/types/global.types';
import { snackbarAtom, nonActiveSpacesAtom } from '@root/src/stores/app';
import { useAtom } from 'jotai';
import { updateSpace } from '@root/src/services/chrome-storage/spaces';
import { useState } from 'react';

type UseUpdateSpaceProps = {
  updateSpaceData: ISpaceWithoutId;
  spaceId: string;
  onClose: () => void;
};

export const useUpdateSpace = ({ updateSpaceData, spaceId, onClose }: UseUpdateSpaceProps) => {
  // global state
  // spaces atom
  const [, setSpaces] = useAtom(nonActiveSpacesAtom);
  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // local state
  const [errorMsg, setErrorMsg] = useState('');

  //  update space
  const handleUpdateSpace = async () => {
    setErrorMsg('');
    if (!updateSpaceData.emoji || !updateSpaceData.title || !updateSpaceData.theme) {
      setErrorMsg('Fill all the fields');
      return;
    }
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Updating space', isLoading: true });

    //  update space
    const res = await updateSpace(spaceId, { ...updateSpaceData, isSaved: true });

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // space update
    if (res) {
      // close modal
      onClose();
      setSpaces(prev => [...prev.filter(s => s.id !== spaceId), { id: spaceId, ...updateSpaceData }]);
      setSnackbar({ show: true, msg: 'Space updated', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to update space', isSuccess: false });
    }
  };

  return {
    handleUpdateSpace,
    errorMsg,
    snackbar,
  };
};
