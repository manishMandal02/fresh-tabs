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
import { showAddNewNoteModalAtom } from '@root/src/stores/app';

const NewNote = () => {
  console.log('NewNote ~ 🔁 rendered');

  // local state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);
  const [note, setNote] = useState(`
  * manish
  * mandal
diff
  ***
  `);

  const handleClose = () => {
    setShowModal({ show: false, ...(showModal.note ? { note: '' } : {}) });
  };

  return (
    <SlideModal title="New Note" isOpen={!showModal.show} onClose={handleClose}>
      <div className="min-h-[50vh] max-h-[70vh] overflow-hidden">
        NewNote
        {/* note mdn editor */}
        <div className="">
          <MDXEditor
            markdown={note}
            onChange={setNote}
            contentEditableClassName="!text-slate-300 !prose !leading-[1rem]"
            placeholder="Note..."
            plugins={[
              headingsPlugin(),
              quotePlugin(),
              listsPlugin(),
              linkPlugin(),
              thematicBreakPlugin(),
              markdownShortcutPlugin(),
            ]}
            className="bg-brand-darkBgAccent/40 px-2 py-1 !text-slate-300 [&_*]:text-slate-300 [&_strong]:!text-slate-300 !caret-slate-100 "
          />
        </div>
      </div>
    </SlideModal>
  );
};

export default NewNote;
