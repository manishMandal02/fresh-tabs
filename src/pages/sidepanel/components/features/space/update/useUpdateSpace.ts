import { ISpaceWithoutId } from '@root/src/types/global.types';
import { snackbarAtom, nonActiveSpacesAtom, activeSpaceAtom } from '@root/src/stores/app';
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
  // active space atom
  const [activeSpace, setActiveSpace] = useAtom(activeSpaceAtom);
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

    if (res) {
      if (spaceId === activeSpace.id) {
        // update active space
        setActiveSpace(prev => ({ ...prev, ...updateSpaceData }));
      }

      // update spaces list ui with same order
      setSpaces(prev => prev.map(s => (s.id === spaceId ? { ...updateSpaceData, id: spaceId } : s)));

      // close modal
      onClose();
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
    setErrorMsg,
  };
};
