import { ISpace, ITab } from '@root/src/pages/types/global.types';
import { snackbarAtom, spacesAtom } from '@root/src/stores/app';
import { useAtom } from 'jotai';
import { deleteSpace, updateSpace } from '@root/src/services/chrome-storage/spaces';
import { useState } from 'react';

type UseUpdateSpaceProps = {
  updateSpaceData: ISpace;
  space: ISpace;
  tabs: ITab[];
  onClose: () => void;
};

export const useUpdateSpace = ({ updateSpaceData, space, tabs, onClose }: UseUpdateSpaceProps) => {
  // global state
  // spaces atom
  const [, setSpaces] = useAtom(spacesAtom);
  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // local state
  const [errorMsg, setErrorMsg] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // handle update space
  const handleUpdateSpace = async () => {
    setErrorMsg('');
    if (!updateSpaceData.emoji || !updateSpaceData.title || !updateSpaceData.theme) {
      setErrorMsg('Fill all the fields');
      return;
    }
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Updating space', isLoading: true });

    //  update space
    const res = await updateSpace(space.id, { ...updateSpaceData, isSaved: true });

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // space update
    if (res) {
      // close modal
      onClose();
      // re-render updated spaces
      setSpaces(prev => [...prev, { ...updateSpaceData, tabs: [...tabs] }]);
      setSnackbar({ show: true, msg: 'Space updated', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to update space', isSuccess: false });
    }
  };

  // handle delete space
  const handleDeleteSpace = async () => {
    setShowDeleteModal(true);

    // show loading snackbar
    setSnackbar({ show: true, msg: 'Deleting space', isLoading: true });

    // delete space
    const res = await deleteSpace(space.id);

    // hide loading snackbar
    setSnackbar({ show: false, msg: 'Deleting space', isLoading: false });

    // space deleted
    if (res) {
      // close modal
      onClose();
      // re-render spaces
      setSpaces(prev => [...prev.filter(s => s.id !== space.id)]);
      setSnackbar({ show: true, msg: 'Space deleted', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to deleted space', isSuccess: false });
    }
  };

  return {
    handleUpdateSpace,
    handleDeleteSpace,
    errorMsg,
    snackbar,
    showDeleteModal,
    setShowDeleteModal,
  };
};
