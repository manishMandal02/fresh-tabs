import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, MouseEventHandler } from 'react';

import injectedStyle from '../injected.css?inline';

import RichTextEditor, {
  EDITOR_EMPTY_STATE,
} from '@root/src/pages/sidepanel/components/elements/rich-text-editor/RichTextEditor';

type Props = {
  userSelectedText: string;
  onClose: () => void;
};

const CreateNote = ({ userSelectedText, onClose }: Props) => {
  // local state
  const [note, setNote] = useState('');

  const modalRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.innerHTML = injectedStyle;
    document.head.appendChild(styleElement);
    setTimeout(() => {
      modalRef.current.showModal();
    }, 10);

    setNote(EDITOR_EMPTY_STATE);
  }, [userSelectedText]);

  // TODO - add note text editor
  // TODO - create a note title
  // TODO - note remainder

  const handleCloseCreateNote = () => {
    onClose();
    modalRef.current.close();
    const containerEl = document.getElementById('fresh-tabs-create-note-command-container');
    if (!containerEl) return;
    containerEl.replaceChildren();
    containerEl.remove();
  };

  // check if modal's backdrop was clicked
  const handleBackdropClick: MouseEventHandler<HTMLDialogElement> = ev => {
    const dialogEl = modalRef.current;

    // check if dialog was clicked or outside

    const rect = dialogEl.getBoundingClientRect();

    const isInDialog =
      rect.top <= ev.clientY &&
      ev.clientY <= rect.top + rect.height &&
      rect.left <= ev.clientX &&
      ev.clientX <= rect.left + rect.width;

    if (!isInDialog) {
      // outside click
      handleCloseCreateNote();
    }
  };

  return note ? (
    createPortal(
      <div
        id="fresh-tabs-create-note-command-container"
        style={{
          all: 'initial',
        }}
        className="w-screen h-screen flex items-center justify-center fixed top-0 left-0 overflow-hidden ">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
        <dialog
          aria-modal
          tabIndex={-1}
          open={false}
          ref={modalRef}
          onClick={handleBackdropClick}
          onKeyDown={ev => {
            ev.stopPropagation();
            ev.nativeEvent.stopImmediatePropagation();
          }}
          className={`z-[99999999] mx-auto top-[20%] left-/12 flex items-center outline-none flex-col justify-center 
                  backdrop:to-brand-darkBg/20  h-fit  w-[40%] max-w-[40%]  p-px bg-transparent`}>
          <div className="z-[9999999999] w-full max-h-[500px] h-fit bg-brand-darkBg rounded-lg cc-scroll-bar">
            {/* editor */}
            <RichTextEditor content={note} onChange={setNote} userSelectedText={userSelectedText} />
          </div>
        </dialog>
      </div>,
      document.body,
    )
  ) : (
    <></>
  );
};
export default CreateNote;
