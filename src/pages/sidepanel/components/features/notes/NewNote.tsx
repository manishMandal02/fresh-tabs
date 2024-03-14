import '@mdxeditor/editor/style.css';

import { useAtom } from 'jotai';
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MDXEditor,
  headingsPlugin,
  quotePlugin,
  listsPlugin,
  linkPlugin,
  thematicBreakPlugin,
  markdownShortcutPlugin,
  type MDXEditorMethods,
} from '@mdxeditor/editor';

import { SlideModal } from '../../elements/modal';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';

const NewNote = () => {
  console.log('NewNote ~ 🔁 rendered');

  // local state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);
  const [note, setNote] = useState('');

  // track dash/minus key pressed (continues)
  const [minusKeyPressedTimes, setMinusKeyPressedTimes] = useState(0);

  useEffect(() => {
    console.log('🚀 ~ NewNote ~ useEffect ~ note:28', note);
  }, [note]);

  const editorRef = useRef<MDXEditorMethods>(null);

  const handleClose = () => {
    setShowModal({ show: false, ...(showModal.note ? { note: '' } : {}) });
  };

  useEffect(() => {
    if (minusKeyPressedTimes === 3) {
      editorRef.current.insertMarkdown('***');

      setMinusKeyPressedTimes(0);

      if (note.includes('\\--')) {
        // setNote(note => note.replaceAll('\\--', '').replaceAll('\\-', '').replaceAll('--', ''));

        const textBox = document.querySelector('.mdxeditor > div > div[role="textbox"]');

        const doubleDashSpan = document.evaluate(
          "//span[contains(., '--')]",
          textBox,
          null,
          XPathResult.ANY_TYPE,
          null,
        );
        const elDoubleDashSpan = doubleDashSpan.iterateNext();

        if (!elDoubleDashSpan) return;

        if (elDoubleDashSpan.textContent === '--') {
          console.log('🚀 ~ NewNote ~ elDoubleDashSpan:', elDoubleDashSpan);

          // remove p node if only -- contained in span
          // elDoubleDashSpan.parentElement.style.display = 'none';
          elDoubleDashSpan.textContent = '';
          elDoubleDashSpan.parentElement.replaceChildren();
          // setNote(note => note.replaceAll('\\--', ''));

          textBox.removeChild(elDoubleDashSpan.parentElement);

          textBox.dispatchEvent(new Event('input', { bubbles: true }));

          // editorRef.current.focus(null, { defaultSelection: 'rootEnd' });
        }
      }
    }
  }, [minusKeyPressedTimes, note]);

  const handleSpaceKeyPressed = useCallback(
    async ev => {
      const keyEv = ev as KeyboardEvent;

      if (
        keyEv.code === 'Minus' &&
        document.activeElement?.getAttribute('role') === 'textbox' &&
        minusKeyPressedTimes < 3
      ) {
        setMinusKeyPressedTimes(prev => prev + 1);
        // editorRef.current.focus();
        ev.preventDefault();
        ev.stopPropagation();
      } else {
        setMinusKeyPressedTimes(0);
      }
    },
    [minusKeyPressedTimes],
  );

  useEffect(() => {
    const textBox = document.querySelector('.mdxeditor > div > div[role="textbox"]');

    if (!textBox) return;

    textBox.addEventListener('keydown', handleSpaceKeyPressed);
    return () => {
      textBox.removeEventListener('keydown', handleSpaceKeyPressed);
    };
  }, [handleSpaceKeyPressed]);

  return (
    <SlideModal title="New Note" isOpen={!showModal.show} onClose={handleClose}>
      <div className="min-h-[50vh] max-h-[70vh] overflow-hidden">
        NewNote
        {/* note mdn editor */}
        <div className="">
          <MDXEditor
            ref={editorRef}
            markdown={note}
            onChange={value => {
              setNote(value);
            }}
            toMarkdownOptions={
              {
                // rule: '-',
              }
            }
            suppressHtmlProcessing={false}
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
            className="bg-brand-darkBgAccent/40 px-2 py-1 !text-slate-300 [&_*]:text-slate-300 [&_strong]:!text-slate-300 [&_hr]:!mt-2 [&_hr]:!mb-2 [&_hr]:!border-slate-500 !caret-slate-100 "
          />
        </div>
      </div>
    </SlideModal>
  );
};

export default NewNote;
