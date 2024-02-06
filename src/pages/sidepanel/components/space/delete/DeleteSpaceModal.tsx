import { AlertModal } from '../../elements/modal';
import { useAtom } from 'jotai';
import { snackbarAtom, nonActiveSpacesAtom, deleteSpaceModalAtom } from '@root/src/stores/app';
import { deleteSpace, getAllSpaces } from '@root/src/services/chrome-storage/spaces';
import { AlarmNames } from '@root/src/constants/app';
import Spinner from '../../elements/spinner';
import { createPortal } from 'react-dom';
import { useEffect, useCallback, useState } from 'react';
import { ISpace } from '@root/src/pages/types/global.types';
import { getCurrentWindowId } from '@root/src/services/chrome-tabs/tabs';

const DeleteSpaceModal = () => {
  // delete space modal  global state
  const [deleteSpaceModal, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  const [spaceToDelete, setSpaceToDelete] = useState<(ISpace & { index: number }) | undefined>(undefined);

  // snackbar atom
  const [nonActiveSpaces, setNonActiveSpaces] = useAtom(nonActiveSpacesAtom);
  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  // get details of space to delete
  const deleteInit = useCallback(
    async (spaceId: string) => {
      console.log('🚀 ~ deleteInit ~ spaceId:', spaceId);

      // get space from storage
      const allSpaces = await getAllSpaces();

      console.log('🚀 ~ deleteInit ~ allSpaces:', allSpaces);

      const spaceToDelete = allSpaces.find(space => space.id === deleteSpaceModal.spaceId);

      console.log('🚀 ~ deleteInit ~ spaceToDelete:', spaceToDelete);

      const currentWindowId = await getCurrentWindowId();

      console.log('🚀 ~ deleteInit ~ currentWindowId:', currentWindowId);

      const isSpaceActive = Number(spaceToDelete?.windowId) === currentWindowId;

      // current index of the space to delete
      const spaceToDeleteIndex = isSpaceActive
        ? 0
        : nonActiveSpaces.findIndex(space => space.id === deleteSpaceModal.spaceId);

      setSpaceToDelete({ ...spaceToDelete, index: spaceToDeleteIndex });

      if (!isSpaceActive) {
        // if space not active
        setNonActiveSpaces(prev => [...prev.filter(s => s.id !== spaceId)]);
      }
    },
    [deleteSpaceModal, setNonActiveSpaces, nonActiveSpaces],
  );

  useEffect(() => {
    if (deleteSpaceModal.show) {
      (async () => {
        await deleteInit(deleteSpaceModal.spaceId);
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deleteSpaceModal]);

  const onClose = (deleteSuccess = false) => {
    setDeleteSpaceModal({ show: false, spaceId: '' });

    if (!deleteSuccess) {
      // revert UI state
      // add the space that was removed for delete action
      (async () => {
        if (spaceToDelete && !nonActiveSpaces.find(s => s.id === spaceToDelete.id)) {
          // add the space back to list
          const { index, ...space } = spaceToDelete;
          setNonActiveSpaces(prev => [...prev.toSpliced(index, 0, space)]);
        }
      })();
    }
  };

  //  delete space handler
  const handleDeleteSpace = async () => {
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Deleting space', isLoading: true });

    const spaceToDeleteId = deleteSpaceModal.spaceId;

    // delete space
    const res = await deleteSpace(spaceToDeleteId);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // close modal
    onClose(res);

    // space deleted
    if (res) {
      // re-render spaces
      setNonActiveSpaces(prev => [...prev.filter(s => s.id !== spaceToDeleteId)]);
      setSnackbar({ show: true, msg: 'Space deleted', isSuccess: true });

      // if the space was unsaved, check if it had any delete trigger scheduled

      const schedule = await chrome.alarms.get(AlarmNames.deleteSpace(spaceToDeleteId));

      if (schedule?.name) {
        // delete scheduled trigger
        await chrome.alarms.clear(schedule.name);
      }
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to deleted space', isSuccess: false });
    }
  };

  return deleteSpaceModal.show
    ? createPortal(
        <AlertModal isOpen={deleteSpaceModal.show} title="Confirm Delete" onClose={onClose}>
          <div className=" px-4 py-2.5 text-slate-400  ">
            <p className="font-light text-sm">Are you sure you want to delete this space?</p>

            <div className=" absolute bottom-4 right-3 ">
              <button
                className="bg-slate-500 text-slate-100 w-20 py-1.5 mr-3 rounded-md hover:opacity-90 transition-all duration-200"
                onClick={() => onClose()}>
                Cancel
              </button>
              <button
                className="bg-red-600 text-slate-100 w-20 py-1.5 rounded-md hover:opacity-90 transition-all duration-200"
                onClick={handleDeleteSpace}>
                {snackbar.isLoading ? <Spinner size="sm" /> : 'Delete'}
              </button>
            </div>
          </div>
        </AlertModal>,
        document.body,
      )
    : null;
};

export default DeleteSpaceModal;
