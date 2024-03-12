import { useAtom } from 'jotai';

import { SlideModal } from '../../elements/modal';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';

const AddNewNote = () => {
  console.log('NewNote ~ 🔁 rendered');

  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);

  const handleClose = () => {
    setShowModal({ show: false, ...(showModal.note ? { note: '' } : {}) });
  };

  return (
    <SlideModal title="New Note" isOpen={showModal.show} onClose={handleClose}>
      <div className="min-h-[50vh]">NewNote</div>
    </SlideModal>
  );
};

export default AddNewNote;
