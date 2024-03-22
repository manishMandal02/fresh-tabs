import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import { SlideModal } from '../../../elements/modal';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';
import Spinner from '../../../elements/spinner';
import { parseStringForDateTimeHint } from '@root/src/pages/utils/date-time/naturalLanguageToDate';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import Checkbox from '../../../elements/checkbox/Checkbox';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import Tooltip from '../../../elements/tooltip';
import { useNewNote } from './useNewNote';
import TextField from '../../../elements/form/text-field';
import RichTextEditor from '../../../elements/rich-text-editor/RichTextEditor';

const DATE_HIGHLIGHT_CLASS_NAME = 'add-note-date-highlight';

const EDITOR_EMPTY_STATE =
  '{"root":{"children":[{"children":[],"direction":null,"format":"","indent":0,"type":"paragraph","version":1}],"direction":null,"format":"","indent":0,"type":"root","version":1}}';

const NotesModal = () => {
  // global state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  const [note, setNote] = useState('');

  useEffect(() => {
    console.log('🚀 ~ NotesModal ~ useEffect ~ note:', note);
  }, [note]);

  const [remainder, setRemainder] = useState('');
  const [shouldAddDomain, setShouldAddDomain] = useState(false);

  const editorContainerRef = useRef<HTMLDivElement>(null);

  // on close modal
  const handleClose = () => {
    setShowModal({ show: false, note: { text: '' } });
    setNote('');
    inputFrom.reset();
  };

  // logic hook
  const { inputFrom, snackbar, handleAddNote, handleOnPasteInDomainInput } = useNewNote({
    note,
    remainder,
    handleClose,
    noteId: showModal.note?.id || '',
  });

  // init component
  useEffect(() => {
    if (!showModal.show) return;

    // check if creating new note or editing note
    if (!showModal.note?.id) {
      // new note
      showModal.note.text?.length > 0 ? setNote(showModal.note.text) : setNote(EDITOR_EMPTY_STATE);
    } else {
      // editing note
      const noteToEdit = showModal.note;

      noteToEdit.text?.length > 0 ? setNote(noteToEdit.text) : setNote(EDITOR_EMPTY_STATE);

      inputFrom.setValue('title', noteToEdit.title);

      if (noteToEdit.domain) {
        setShouldAddDomain(true);
        inputFrom.setValue('domain', noteToEdit.domain);
      }
      if (noteToEdit.remainderAt) {
        const dateHintString = parseStringForDateTimeHint(noteToEdit.text);

        if (dateHintString?.dateString) {
          setRemainder(dateHintString.dateString);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // check for data hint string for remainders
  useEffect(() => {
    console.log('🚀 ~ useEffect ~ note:', note);

    // TODO -  debounce
    if (note?.length < 6) return;

    const res = parseStringForDateTimeHint(note);

    // remove this date highlight class from other spans if applied
    const removeDateHighlightStyle = (spanElNode?: Node) => {
      const allSpanWithClass = editorContainerRef.current?.querySelectorAll(`span.${DATE_HIGHLIGHT_CLASS_NAME}`);

      if (allSpanWithClass?.length > (spanElNode ? 0 : 1)) {
        for (const spanWithClass of allSpanWithClass) {
          // remove all the classes
          if (!spanElNode) {
            spanWithClass.classList.remove(DATE_HIGHLIGHT_CLASS_NAME);
            continue;
          }

          if (spanElNode && spanWithClass !== spanElNode) {
            //  remove all expect the last one (last occurrence of date highlight)
            spanWithClass.classList.remove(DATE_HIGHLIGHT_CLASS_NAME);
          }
        }
      }
    };
    if (!res) {
      setRemainder('');
      removeDateHighlightStyle();
      return;
    }

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
    // add date highlight class
    (spanEl as HTMLSpanElement).classList.add('add-note-date-highlight');

    removeDateHighlightStyle(spanEl);
  }, [note]);

  const { bounce } = useCustomAnimation();

  const buttonText = showModal.note?.id ? 'Update Note' : 'Add Note';

  return note ? (
    <SlideModal title={showModal.note?.id ? 'Edit Note' : 'New Note'} isOpen={showModal.show} onClose={handleClose}>
      <div className="min-h-[60vh] max-h-[90vh] w-full flex h-full flex-col justify-between">
        {/* note mdn editor */}
        <div
          className="w-full px-2.5 mb-1.5 mt-2 h-[90%] overflow-hidden relative flex flex-col"
          ref={editorContainerRef}>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div className="mb-1.5" onKeyDown={ev => ev.stopPropagation()}>
            <TextField
              name="note-title"
              placeholder="Title..."
              registerHook={inputFrom.register('title')}
              error={inputFrom.formState.errors.title?.message || ''}
            />
          </div>
          <div className="size-full">
            {/* editor */}
            <RichTextEditor content={note} onChange={setNote} />
          </div>
          {/* show note remainder */}
          <div className="w-full mt-1.5 px-1 min-h-8 h-fit flex items-center justify-between">
            <div className="flex items-center">
              <Checkbox
                id="note-domain"
                size="sm"
                checked={shouldAddDomain}
                onChange={checked => {
                  setShouldAddDomain(checked);
                  inputFrom.reset({ domain: '' });
                }}
              />
              <label htmlFor="note-domain" className="text-slsate-300 font-light text-[10xp] ml-[4px] select-none">
                Attach note to a site
              </label>
              <Tooltip label="This note will be attached to the site for quick access while browsing" delay={100}>
                <InfoCircledIcon className="ml-1 text-slate-500/80" />
              </Tooltip>
            </div>
            {remainder ? (
              <motion.div
                {...bounce}
                className="pl-1.5 pr-2 py-[1.75px] rounded-[4px] bg-brand-darkBgAccent/50  w-fit uppercase flex items-center">
                ⏰ <p className="ml-[5px] text-slate-400/90 font-semibold text-[8px]">{remainder}</p>
              </motion.div>
            ) : null}
          </div>
        </div>

        <div className="w-full h-[20%] px-2.5 mt-1 mb-px flex flex-col">
          {shouldAddDomain ? (
            // eslint-disable-next-line jsx-a11y/no-static-element-interactions
            <div className="w-[70%] -mt-1 ml-1" onKeyDown={ev => ev.stopPropagation()}>
              <TextField
                name="note-domain"
                placeholder="chat.openai.com"
                label="Site name"
                onPasteHandler={handleOnPasteInDomainInput}
                registerHook={inputFrom.register('domain')}
                error={inputFrom.formState.errors.domain?.message || ''}
              />
            </div>
          ) : null}

          {/* add note */}
          <button
            onClick={inputFrom.handleSubmit(handleAddNote)}
            disabled={!note || !inputFrom.watch('title') || (shouldAddDomain && !inputFrom.watch('domain'))}
            className={`mt-4 mx-auto w-[65%] py-2.5 rounded-md text-brand-darkBg/70 font-semibold text-[13px] bg-brand-primary/90 hover:opacity-95 transition-all duration-200 
                        border-none outline-none focus-within:outline-slate-600 disabled:bg-brand-darkBgAccent disabled:text-slate-300 disabled:cursor-not-allowed `}>
            {snackbar.isLoading ? <Spinner size="sm" /> : buttonText}
          </button>
        </div>
      </div>
    </SlideModal>
  ) : (
    <></>
  );
};

export default NotesModal;
