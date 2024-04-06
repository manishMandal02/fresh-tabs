import { useAtom } from 'jotai';
import { motion } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

import { useNewNote } from './useNewNote';
import Spinner from '../../../../../../components/spinner';
import Tooltip from '../../../../../../components/tooltip';
import { SlideModal } from '../../../../../../components/modal';
import { InfoCircledIcon } from '@radix-ui/react-icons';
import TextField from '../../../../../../components/form/text-field';
import Checkbox from '../../../../../../components/checkbox/Checkbox';
import { showAddNewNoteModalAtom } from '@root/src/stores/app';
import { useCustomAnimation } from '../../../../hooks/useAnimation';
import RichTextEditor, { EDITOR_EMPTY_STATE } from '../../../../../../components/rich-text-editor/RichTextEditor';
import { parseStringForDateTimeHint } from '@root/src/utils/date-time/naturalLanguageToDate';

const NotesModal = () => {
  console.log('NotesModal ~ 🔁 rendered');

  // global state
  const [showModal, setShowModal] = useAtom(showAddNewNoteModalAtom);

  // local state
  const [note, setNote] = useState('');
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
          // TODO - highlight style for date hint
          setRemainder(dateHintString.dateString);
        }
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  const { bounce } = useCustomAnimation();

  const buttonText = showModal.note?.id ? 'Update Note' : 'Add Note';

  return note ? (
    <SlideModal title={showModal.note?.id ? 'Edit Note' : 'New Note'} isOpen={showModal.show} onClose={handleClose}>
      <div className="min-h-[60vh] max-h-[90vh] w-full flex h-full flex-col justify-between">
        {/* note mdn editor */}
        <div
          className="w-full px-2.5 mb-1.5 mt-2 h-[90%] overflow-hidden relative flex flex-col "
          ref={editorContainerRef}>
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div className="mb-1.5">
            <TextField
              name="note-title"
              placeholder="Title..."
              registerHook={inputFrom.register('title')}
              error={inputFrom.formState.errors.title?.message || ''}
            />
          </div>
          <div className="w-full h-[300px] max-h-full">
            {/* editor */}
            <RichTextEditor content={note} onChange={setNote} setRemainder={setRemainder} />
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
              <label htmlFor="note-domain" className="text-slate-300/80 font-light text-[10px] ml-[4px] select-none">
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
