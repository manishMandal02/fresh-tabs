import { useSetAtom } from 'jotai';
import { AlertModal } from '../../../../../components/modal';
import { notesAtom, snackbarAtom } from '@root/src/stores/app';
import { deleteNote } from '@root/src/services/chrome-storage/notes';

type Props = {
  noteId: string;
  onClose: () => void;
};

const DeleteNote = ({ noteId, onClose }: Props) => {
  // global state
  const setSnackbar = useSetAtom(snackbarAtom);
  const setNotesGlobal = useSetAtom(notesAtom);

  const handleDelete = async () => {
    const res = await deleteNote(noteId);
    if (res) {
      setNotesGlobal(notes => notes.filter(note => note.id !== noteId));
      setSnackbar({ show: true, isLoading: false, isSuccess: true, msg: 'Note deleted.' });
    } else {
      setSnackbar({ show: true, isLoading: false, isSuccess: false, msg: 'Failed to delete note.' });
    }
  };

  return noteId ? (
    <AlertModal isOpen={!!noteId} title="Confirm Delete" showCloseBtn={false} onClose={onClose}>
      <div className=" px-3 py-2.5 text-slate-400  h-fit">
        <p className="font-light text-sm">Are you sure you want to delete this note?</p>

        <div className=" mt-3 ml-auto w-fit">
          <button
            className="bg-brand-darkBgAccent/80 text-slate-200 mr-2 w-20 py-1.5 rounded-md hover:opacity-90 transition-all duration-200  "
            onClick={() => onClose()}>
            Cancel
          </button>
          <button
            className="bg-red-600 text-slate-200 w-20 py-1.5 rounded-md hover:opacity-90 transition-all duration-200 "
            onClick={handleDelete}>
            Delete
          </button>
        </div>
      </div>
    </AlertModal>
  ) : null;
};

export default DeleteNote;
