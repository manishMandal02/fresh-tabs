import { AlertModal } from '../../elements/modal';
import { useAtom } from 'jotai';
import { snackbarAtom, nonActiveSpacesAtom, deleteSpaceModalAtom } from '@root/src/stores/app';
import { deleteSpace } from '@root/src/services/chrome-storage/spaces';
import { AlarmNames } from '@root/src/constants/app';
import Spinner from '../../elements/spinner';
import { createPortal } from 'react-dom';

const DeleteSpaceModal = () => {
  // delete space modal  global state
  const [deleteSpaceModal, setDeleteSpaceModal] = useAtom(deleteSpaceModalAtom);

  // snackbar atom
  const [, setSpaces] = useAtom(nonActiveSpacesAtom);
  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  const onClose = () => {
    setDeleteSpaceModal({ show: false, spaceId: '' });
  };

  //  delete space handler
  const handleDeleteSpace = async () => {
    // show loading snackbar
    setSnackbar({ show: true, msg: 'Deleting space', isLoading: true });

    const spaceToDelete = deleteSpaceModal.spaceId;

    // delete space
    const res = await deleteSpace(spaceToDelete);

    // hide loading snackbar
    setSnackbar({ show: false, msg: '', isLoading: false });

    // close modal
    onClose();

    // space deleted
    if (res) {
      // re-render spaces
      setSpaces(prev => [...prev.filter(s => s.id !== spaceToDelete)]);
      setSnackbar({ show: true, msg: 'Space deleted', isSuccess: true });

      // if the space was unsaved, check if it had any delete trigger scheduled

      const schedule = await chrome.alarms.get(AlarmNames.deleteSpace(spaceToDelete));

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
                onClick={onClose}>
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
