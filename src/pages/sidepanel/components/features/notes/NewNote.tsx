import '@mdxeditor/editor/style.css';

import { useAtom } from 'jotai';
import { useState } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  quotePlugin,
  listsPlugin,
  linkPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
} from '@mdxeditor/editor';

import { SlideModal } from '../../elements/modal';
import { showAddNewNoteModalAtom, snackbarAtom } from '@root/src/stores/app';
import Spinner from '../../elements/spinner';

const NewNote = () => {
  console.log('NewNote ~ 🔁 rendered');

  // global state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);
  // local state
  const [note, setNote] = useState('');

  const handleClose = () => {
    setShowModal({ show: false, ...(showModal.note ? { note: '' } : {}) });
  };

  const handleAddNote = () => {
    if (showModal) {
      setSnackbar({ show: true, msg: 'Note added', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to add note', isSuccess: false });
    }
  };

  return (
    <SlideModal title="New Note" isOpen={!showModal.show} onClose={handleClose}>
      <div className="min-h-[60vh] w-full h-full flex flex-col">
        {/* note mdn editor */}
        <div className="px-3 mt-4 h-full overflow-hidden relative">
          <MDXEditor
            markdown={note}
            onChange={value => {
              setNote(value);
            }}
            suppressHtmlProcessing={false}
            contentEditableClassName="prose !h-[18rem] !w-full leading-[ "
            placeholder="Write your note..."
            plugins={[
              headingsPlugin({ allowedHeadingLevels: [1, 2, 3] }),
              quotePlugin(),
              listsPlugin(),
              linkPlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
            ]}
            className={`w-full h-fit !bg-brand-darkBgAccent/25 cc-scrollbar !overflow-y-auto rounded-md px-px !py-1 dark-theme [&_blockquote]:!text-slate-400 [&_strong]:!text-slate-300/90 [&_span]:!text-slate-300/90 [&_p]:!my-0 [&_li]:!my-0 [&_blockquote]:!my-1.5 [&_h1]:!my-1 [&_h2]:!my-1 [&_h3]:!my-px`}
          />
        </div>

        {/* add note */}
        <button
          className={`mt-8 mx-auto w-[65%] py-2.5 rounded-md text-brand-darkBg/70 font-semibold text-[13px] bg-brand-primary/90
                      hover:opacity-95 transition-all duration-200 border-none outline-none focus-within:outline-slate-600`}
          onClick={handleAddNote}>
          {snackbar.isLoading ? <Spinner size="sm" /> : 'Add Note'}
        </button>
      </div>
    </SlideModal>
  );
};

export default NewNote;
