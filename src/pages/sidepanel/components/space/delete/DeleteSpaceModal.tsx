import { AlertModal } from '../../elements/modal';
import { useAtom } from 'jotai';
import { snackbarAtom, spacesAtom } from '@root/src/stores/app';
import { deleteSpace } from '@root/src/services/chrome-storage/spaces';
import { AlarmNames } from '@root/src/constants/app';
import Spinner from '../../elements/spinner';

type Props = {
  show: boolean;
  onClose: () => void;
  spaceId: string;
};

const DeleteSpaceModal = ({ spaceId, show, onClose }: Props) => {
  // snackbar atom
  const [, setSpaces] = useAtom(spacesAtom);
  // snackbar atom
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);

  //  delete space handler
  const handleDeleteSpace = async () => {
    onClose();

    // show loading snackbar
    setSnackbar({ show: true, msg: 'Deleting space', isLoading: true });

    // delete space
    const res = await deleteSpace(spaceId);

    // hide loading snackbar
    setSnackbar({ show: false, msg: 'Deleting space', isLoading: false });

    // space deleted
    if (res) {
      // close modal
      onClose();
      // re-render spaces
      setSpaces(prev => [...prev.filter(s => s.id !== spaceId)]);
      setSnackbar({ show: true, msg: 'Space deleted', isSuccess: true });

      // if the space was unsaved, check if it had any delete trigger scheduled

      const schedule = await chrome.alarms.get(AlarmNames.deleteSpace(spaceId));

      if (schedule?.name) {
        // delete scheduled trigger
        await chrome.alarms.clear(schedule.name);
      }
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to deleted space', isSuccess: false });
    }
  };

  return (
    <AlertModal isOpen={show} title="Confirm Delete" onClose={onClose}>
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
    </AlertModal>
  );
};

export default DeleteSpaceModal;
