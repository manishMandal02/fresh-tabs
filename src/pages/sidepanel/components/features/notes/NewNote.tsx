import '@mdxeditor/editor/style.css';

import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
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
import { showAddNewNoteModalAtom, snackbarAtom } from '@root/src/stores/app';
import Spinner from '../../elements/spinner';
import { wait } from '@root/src/pages/utils';
import { useKeyPressed } from '../../../hooks/useKeyPressed';
import { parseStringForDateTimeHint } from '@root/src/pages/utils/date-time/naturalLanguageToDate';
import { useCustomAnimation } from '../../../hooks/useAnimation';

const NewNote = () => {
  console.log('NewNote ~ 🔁 rendered');

  // global state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);
  const [snackbar, setSnackbar] = useAtom(snackbarAtom);
  // local state
  const [note, setNote] = useState('');
  const [remainder, setRemainder] = useState('');

  const editorRef = useRef<MDXEditorMethods>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showModal.show) return;
    if (showModal.note) {
      setNote(showModal.note);
      editorRef.current.setMarkdown(showModal.note);
    }
    (async () => {
      await wait(100);

      editorRef.current?.focus();
    })();
  }, [showModal]);

  const handleClose = () => {
    setShowModal({ show: false, ...(showModal.note ? { note: '' } : {}) });
    setNote('');
  };

  const handleAddNote = () => {
    if (showModal) {
      setSnackbar({ show: true, msg: 'Note added', isSuccess: true });
    } else {
      // failed
      setSnackbar({ show: true, msg: 'Failed to add note', isSuccess: false });
    }
  };

  const { isModifierKeyPressed } = useKeyPressed({ monitorModifierKeys: true });

  // open links in editor with cmd/ctrl + click
  const handleAnchorClick = useCallback(ev => {
    const clickedEl = ev.target as HTMLElement;

    if (clickedEl.tagName === 'SPAN' && clickedEl.parentElement.tagName === 'A') {
      (async () => {
        await chrome.tabs.create({ url: (clickedEl.parentElement as HTMLAnchorElement).href, active: true });
      })();
    }
  }, []);

  // handle click in editor box after cmd is pressed
  useEffect(() => {
    if (!isModifierKeyPressed) return;
    const editorBox = editorContainerRef.current.querySelector('div[role="textbox"]');

    if (!editorBox) return;

    editorBox.addEventListener('click', handleAnchorClick);

    () => {
      if (!isModifierKeyPressed) {
        editorBox?.removeEventListener('click', handleAnchorClick);
      }
    };
  }, [isModifierKeyPressed, handleAnchorClick]);

  // check for data hint string for remainders
  useEffect(() => {
    // TODO -  debounce
    if (editorRef.current?.getMarkdown().length < 6) return;

    const res = parseStringForDateTimeHint(editorRef.current?.getMarkdown());
    if (!res) return;
    console.log('🚀 ~ useEffect ~ res:', res);

    // store the last occurrence of the date hint
    setRemainder(res.dateString);

    // find the date hint el and style it
    const span = document.evaluate(
      `//span[contains(., '${res.dateString}')]`,
      document,
      null,
      XPathResult.ANY_TYPE,
      null,
    );
    const spanEl = span.iterateNext();

    if (!spanEl) return;
    (spanEl as HTMLSpanElement).classList.add('add-note-date-highlight');

    // remove this date highlight class from other spans if applied
    const allSpanWithClass = editorContainerRef.current?.querySelectorAll('span.add-note-date-highlight');

    if (allSpanWithClass.length > 1) {
      for (const spanWithClass of allSpanWithClass) {
        if (spanWithClass !== spanEl) {
          spanWithClass.classList.remove('add-note-date-highlight');
        }
      }
    }
  }, [note]);

  // animation
  const { bounce } = useCustomAnimation();

  return (
    <SlideModal title="New Note" isOpen={showModal.show} onClose={handleClose}>
      <div className="min-h-[60vh] w-full h-full flex flex-col">
        {/* note mdn editor */}
        <div className="px-3 mt-2.5 h-full overflow-hidden relative flex flex-col" ref={editorContainerRef}>
          <MDXEditor
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus={{ defaultSelection: 'rootEnd' }}
            ref={editorRef}
            markdown={note}
            onChange={setNote}
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
            className={`w-full h-fit !bg-brand-darkBgAccent/25 cc-scrollbar !overflow-y-auto rounded-md px-px !py-px dark-theme [&_blockquote]:!text-slate-400 [&_strong]:!text-slate-300/90 [&_span:not(.add-note-date-highlight)]:!text-slate-300/80 [&_a>span]:!underline [&_p]:!my-0 [&_li]:!my-0 [&_blockquote]:!my-1.5 [&_h1]:!my-1 [&_h2]:!my-1 [&_h3]:!my-px [&_h4]:!my-px [&_h5]:!my-px [&_h6]:!my-px ${
              isModifierKeyPressed ? '[&_a]:!cursor-pointer' : ''
            }`}
          />
          {/* show note remainder */}
          <div className="mt-2 w-full px-2">
            {remainder ? (
              <motion.div
                {...bounce}
                className="pl-1.5 pr-2 py-1 rounded-md bg-brand-darkBgAccent/60  w-fit uppercase ml-auto flex items-center">
                ⏰ <span className="ml-[5px] text-slate-400/90 font-semibold text-[10px]">{remainder}</span>
              </motion.div>
            ) : null}
          </div>
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
